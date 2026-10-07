import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { randomUUID } from "node:crypto";
import {
  computeRequirementsCatalogTotalMinor,
  normalizePromotionSave,
  promotionPersistSchema,
  promotionPriceWarning,
  PROMOTION_NO_SAVINGS_WARNING,
  requirementCatalogStatus,
} from "@/lib/promotions/promotionSchema";
import type { StoreMagnetSize } from "@/models/StoreSettings";

const largeId = "size-large";
const smallId = "size-small";

const storeSizes: StoreMagnetSize[] = [
  {
    id: largeId,
    name: "גדול",
    dimensionsLabel: "20×30",
    priceMinor: 8000,
    enabled: true,
    sortOrder: 0,
  },
  {
    id: smallId,
    name: "קטן",
    dimensionsLabel: "10×10",
    priceMinor: 3000,
    enabled: true,
    sortOrder: 1,
  },
  {
    id: "disabled-size",
    name: "ישן",
    dimensionsLabel: "",
    priceMinor: 5000,
    enabled: false,
    sortOrder: 2,
  },
];

function validPersist(overrides?: Partial<Parameters<typeof promotionPersistSchema.parse>[0]>) {
  return {
    promotionId: randomUUID(),
    internalName: "מבצע משפחתי",
    bannerText: "",
    enabled: true,
    showInBanner: false,
    bannerSortOrder: 0,
    bundlePriceMinor: 14900,
    requirements: [
      { material: "magnet" as const, magnetSizeId: largeId, quantity: 2 },
      { material: "magnet" as const, magnetSizeId: smallId, quantity: 1 },
    ],
    ...overrides,
  };
}

describe("promotionPersistSchema", () => {
  it("accepts valid promotion", () => {
    assert.equal(promotionPersistSchema.safeParse(validPersist()).success, true);
  });

  it("requires stable promotionId uuid", () => {
    const id = randomUUID();
    const parsed = promotionPersistSchema.parse(validPersist({ promotionId: id }));
    assert.equal(parsed.promotionId, id);
    assert.equal(promotionPersistSchema.safeParse(validPersist({ promotionId: "not-uuid" })).success, false);
  });

  it("requires at least one requirement", () => {
    assert.equal(
      promotionPersistSchema.safeParse(validPersist({ requirements: [] })).success,
      false,
    );
  });

  it("rejects duplicate magnetSizeId", () => {
    assert.equal(
      promotionPersistSchema.safeParse(
        validPersist({
          requirements: [
            { material: "magnet", magnetSizeId: largeId, quantity: 1 },
            { material: "magnet", magnetSizeId: largeId, quantity: 2 },
          ],
        }),
      ).success,
      false,
    );
  });

  it("rejects quantity 0", () => {
    assert.equal(
      promotionPersistSchema.safeParse(
        validPersist({
          requirements: [{ material: "magnet", magnetSizeId: largeId, quantity: 0 }],
        }),
      ).success,
      false,
    );
  });

  it("rejects quantity above 20", () => {
    assert.equal(
      promotionPersistSchema.safeParse(
        validPersist({
          requirements: [{ material: "magnet", magnetSizeId: largeId, quantity: 21 }],
        }),
      ).success,
      false,
    );
  });

  it("rejects negative bundle price", () => {
    assert.equal(
      promotionPersistSchema.safeParse(validPersist({ bundlePriceMinor: -1 })).success,
      false,
    );
  });

  it("requires bannerText when showInBanner", () => {
    assert.equal(
      promotionPersistSchema.safeParse(
        validPersist({ showInBanner: true, bannerText: "   " }),
      ).success,
      false,
    );
    assert.equal(
      promotionPersistSchema.safeParse(
        validPersist({ showInBanner: true, bannerText: "מבצע 🎉" }),
      ).success,
      true,
    );
  });

  it("allows empty bannerText when showInBanner false", () => {
    assert.equal(
      promotionPersistSchema.safeParse(validPersist({ showInBanner: false, bannerText: "" })).success,
      true,
    );
  });

  it("validates bannerSortOrder integer", () => {
    assert.equal(
      promotionPersistSchema.safeParse(validPersist({ bannerSortOrder: 3.5 })).success,
      false,
    );
  });
});

describe("normalizePromotionSave", () => {
  it("parses ILS to exact minor units", () => {
    const result = normalizePromotionSave({
      promotionId: randomUUID(),
      input: {
        internalName: "Test",
        bundlePriceIls: "149.90",
        enabled: true,
        showInBanner: false,
        bannerText: "",
        bannerSortOrder: 0,
        requirements: [{ magnetSizeId: largeId, quantity: 1 }],
      },
      persistedMagnetSizes: storeSizes,
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.bundlePriceMinor, 14990);
    }
  });

  it("rejects duplicate sizes in form", () => {
    const result = normalizePromotionSave({
      promotionId: randomUUID(),
      input: {
        internalName: "Test",
        bundlePriceIls: "100",
        enabled: true,
        showInBanner: false,
        bannerText: "",
        bannerSortOrder: 0,
        requirements: [
          { magnetSizeId: largeId, quantity: 1 },
          { magnetSizeId: largeId, quantity: 2 },
        ],
      },
      persistedMagnetSizes: storeSizes,
    });
    assert.equal(result.ok, false);
  });

  it("rejects unknown magnet size on save", () => {
    const result = normalizePromotionSave({
      promotionId: randomUUID(),
      input: {
        internalName: "Test",
        bundlePriceIls: "100",
        enabled: true,
        showInBanner: false,
        bannerText: "",
        bannerSortOrder: 0,
        requirements: [{ magnetSizeId: "missing", quantity: 1 }],
      },
      persistedMagnetSizes: storeSizes,
    });
    assert.equal(result.ok, false);
  });
});

describe("requirement catalog status", () => {
  it("flags disabled magnet size", () => {
    const status = requirementCatalogStatus("disabled-size", storeSizes);
    assert.equal(status.status, "disabled");
  });

  it("flags missing magnet size", () => {
    const status = requirementCatalogStatus("gone", storeSizes);
    assert.equal(status.status, "missing");
  });

  it("ok for enabled priced size", () => {
    assert.equal(requirementCatalogStatus(largeId, storeSizes).status, "ok");
  });
});

describe("promotion price warning", () => {
  it("no warning when bundle below catalog", () => {
    const catalog = computeRequirementsCatalogTotalMinor({
      requirements: [
        { material: "magnet", magnetSizeId: largeId, quantity: 2 },
        { material: "magnet", magnetSizeId: smallId, quantity: 1 },
      ],
      persistedMagnetSizes: storeSizes,
    });
    assert.equal(catalog.ok, true);
    if (catalog.ok) {
      assert.equal(catalog.totalMinor, 19000);
      assert.equal(promotionPriceWarning(14900, catalog.totalMinor), null);
    }
  });

  it("warns when bundle equals catalog", () => {
    assert.equal(promotionPriceWarning(19000, 19000), PROMOTION_NO_SAVINGS_WARNING);
  });

  it("warns when bundle above catalog", () => {
    assert.equal(promotionPriceWarning(20000, 19000), PROMOTION_NO_SAVINGS_WARNING);
  });
});
