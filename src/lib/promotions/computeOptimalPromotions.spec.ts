import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildVariantInventory,
  type PricedLineForPromotions,
} from "@/lib/promotions/buildVariantInventory";
import { computeOptimalPromotions } from "@/lib/promotions/computeOptimalPromotions";
import type { PromotionForEngine } from "@/lib/promotions/promotionEngineTypes";
import {
  filterRuntimeEligiblePromotions,
} from "@/lib/promotions/loadEnabledPromotions";

const LARGE = "size-large";
const SMALL = "size-small";

const prices = new Map([
  [LARGE, 8_900],
  [SMALL, 6_900],
]);

function linesFromMagnetCounts(
  counts: Record<string, number>,
  woodMinor = 0,
): PricedLineForPromotions[] {
  const out: PricedLineForPromotions[] = [];
  if (woodMinor > 0) {
    out.push({
      material: "wood",
      quantity: 1,
      unitPriceMinor: woodMinor,
      lineTotalMinor: woodMinor,
    });
  }
  for (const [id, qty] of Object.entries(counts)) {
    if (qty <= 0) continue;
    const unit = prices.get(id)!;
    out.push({
      material: "magnet",
      magnetSizeId: id,
      quantity: qty,
      unitPriceMinor: unit,
      lineTotalMinor: unit * qty,
    });
  }
  return out;
}

function inventory(counts: Record<string, number>, woodMinor = 0) {
  return buildVariantInventory(linesFromMagnetCounts(counts, woodMinor));
}

function familyBundle(): PromotionForEngine {
  return {
    promotionId: "promo-family",
    internalName: "מבצע משפחתי",
    bannerText: "מבצע משפחתי",
    bundlePriceMinor: 14_900,
    requirements: [
      { magnetSizeId: LARGE, quantity: 2 },
      { magnetSizeId: SMALL, quantity: 1 },
    ],
  };
}

function promo(
  id: string,
  requirements: PromotionForEngine["requirements"],
  bundlePriceMinor: number,
): PromotionForEngine {
  return {
    promotionId: id,
    internalName: id,
    bannerText: "",
    bundlePriceMinor,
    requirements,
  };
}

const pricingInput = {
  woodEnabled: true,
  magnetEnabled: true,
  woodPriceMinor: 12_000,
  magnetPriceMinor: 5_000,
  magnetSizes: [
    {
      id: LARGE,
      name: "גדול",
      dimensionsLabel: "",
      priceMinor: 8_900,
      enabled: true,
      sortOrder: 0,
    },
    {
      id: SMALL,
      name: "קטן",
      dimensionsLabel: "",
      priceMinor: 6_900,
      enabled: true,
      sortOrder: 1,
    },
  ],
};

describe("computeOptimalPromotions", () => {
  it("1: no promotions — catalog total", () => {
    const inv = inventory({ [LARGE]: 1 });
    const r = computeOptimalPromotions({ inventory: inv, promotions: [] });
    assert.equal(r.catalogSubtotalMinor, 8_900);
    assert.equal(r.discountMinor, 0);
    assert.equal(r.productTotalMinor, 8_900);
    assert.equal(r.applications.length, 0);
  });

  it("3-4: exact single family bundle", () => {
    const inv = inventory({ [LARGE]: 2, [SMALL]: 1 });
    const r = computeOptimalPromotions({
      inventory: inv,
      promotions: [familyBundle()],
    });
    assert.equal(r.productTotalMinor, 14_900);
    assert.equal(r.discountMinor, 8_900 * 2 + 6_900 - 14_900);
    assert.equal(r.applications[0]!.applicationCount, 1);
  });

  it("4: insufficient quantity — no application", () => {
    const inv = inventory({ [LARGE]: 1, [SMALL]: 1 });
    const r = computeOptimalPromotions({
      inventory: inv,
      promotions: [familyBundle()],
    });
    assert.equal(r.discountMinor, 0);
  });

  it("8-9: one bundle plus leftover small at catalog", () => {
    const inv = inventory({ [LARGE]: 2, [SMALL]: 2 });
    const r = computeOptimalPromotions({
      inventory: inv,
      promotions: [familyBundle()],
    });
    assert.equal(r.productTotalMinor, 14_900 + 6_900);
    assert.equal(r.applications[0]!.applicationCount, 1);
  });

  it("10: unrelated wood charged at catalog alongside bundle", () => {
    const inv = inventory({ [LARGE]: 2, [SMALL]: 1 }, 12_000);
    const r = computeOptimalPromotions({
      inventory: inv,
      promotions: [familyBundle()],
    });
    assert.equal(r.productTotalMinor, 14_900 + 12_000);
    assert.equal(r.catalogSubtotalMinor, 8_900 * 2 + 6_900 + 12_000);
  });

  it("11: same size across separate lines aggregates", () => {
    const lines: PricedLineForPromotions[] = [
      {
        material: "magnet",
        magnetSizeId: LARGE,
        quantity: 1,
        unitPriceMinor: 8_900,
        lineTotalMinor: 8_900,
      },
      {
        material: "magnet",
        magnetSizeId: LARGE,
        quantity: 1,
        unitPriceMinor: 8_900,
        lineTotalMinor: 8_900,
      },
      {
        material: "magnet",
        magnetSizeId: SMALL,
        quantity: 1,
        unitPriceMinor: 6_900,
        lineTotalMinor: 6_900,
      },
    ];
    const inv = buildVariantInventory(lines);
    const r = computeOptimalPromotions({
      inventory: inv,
      promotions: [familyBundle()],
    });
    assert.equal(r.productTotalMinor, 14_900);
  });

  it("12-13: same promotion twice when inventory allows", () => {
    const inv = inventory({ [LARGE]: 4, [SMALL]: 2 });
    const r = computeOptimalPromotions({
      inventory: inv,
      promotions: [familyBundle()],
    });
    assert.equal(r.productTotalMinor, 14_900 * 2);
    assert.equal(r.applications[0]!.applicationCount, 2);
  });

  it("14-16: competing promotions pick globally cheapest", () => {
    const inv = inventory({ [LARGE]: 4 });
    const pair = promo("promo-pair", [{ magnetSizeId: LARGE, quantity: 2 }], 10_000);
    const quad = promo("promo-quad", [{ magnetSizeId: LARGE, quantity: 4 }], 35_000);
    const r = computeOptimalPromotions({
      inventory: inv,
      promotions: [quad, pair],
    });
    assert.equal(r.productTotalMinor, 20_000);
    assert.equal(r.applications[0]!.promotionId, "promo-pair");
    assert.equal(r.applications[0]!.applicationCount, 2);
  });

  it("18: catalog pricing wins when cheaper than bundle", () => {
    const inv = inventory({ [LARGE]: 2 });
    const weak = promo("weak", [{ magnetSizeId: LARGE, quantity: 2 }], 20_000);
    const eligible = filterRuntimeEligiblePromotions({
      promotions: [weak],
      pricingInput,
      inventory: inv,
    });
    assert.equal(eligible.length, 0);
    const r = computeOptimalPromotions({ inventory: inv, promotions: [weak] });
    assert.equal(r.discountMinor, 0);
  });

  it("19: deterministic tie — fewer applications wins", () => {
    const inv = inventory({ [LARGE]: 2 });
    const p1 = promo("promo-z", [{ magnetSizeId: LARGE, quantity: 2 }], 17_000);
    const p2 = promo("promo-a", [{ magnetSizeId: LARGE, quantity: 2 }], 17_000);
    const r1 = computeOptimalPromotions({
      inventory: inv,
      promotions: [p1, p2],
    });
    const r2 = computeOptimalPromotions({
      inventory: inv,
      promotions: [p2, p1],
    });
    assert.equal(r1.productTotalMinor, r2.productTotalMinor);
    assert.equal(r1.applications[0]!.promotionId, "promo-a");
  });

  it("20: bannerSortOrder does not affect result (order shuffled)", () => {
    const inv = inventory({ [LARGE]: 2, [SMALL]: 1 });
    const highSort = { ...familyBundle(), promotionId: "zzz" };
    const r = computeOptimalPromotions({
      inventory: inv,
      promotions: [highSort, familyBundle()],
    });
    assert.equal(r.productTotalMinor, 14_900);
  });

  it("22: savings equals catalog minus product", () => {
    const inv = inventory({ [LARGE]: 4, [SMALL]: 2 });
    const r = computeOptimalPromotions({
      inventory: inv,
      promotions: [familyBundle()],
    });
    assert.equal(
      r.discountMinor,
      r.catalogSubtotalMinor - r.productTotalMinor,
    );
  });

  it("24: performance guard falls back to catalog-only", () => {
    const inv = inventory({ [LARGE]: 10, [SMALL]: 10 });
    const manyPromos: PromotionForEngine[] = [];
    for (let i = 0; i < 8; i++) {
      manyPromos.push(
        promo(`p-${i}`, [{ magnetSizeId: LARGE, quantity: 1 }], 8_000 + i),
      );
    }
    const r = computeOptimalPromotions({
      inventory: inv,
      promotions: manyPromos,
      maxMemoStates: 1,
    });
    assert.equal(r.optimizationFallback, true);
    assert.equal(r.discountMinor, 0);
    assert.equal(r.productTotalMinor, r.catalogSubtotalMinor);
  });
});

describe("filterRuntimeEligiblePromotions", () => {
  it("6-7: disabled magnet size excludes promotion", () => {
    const inv = inventory({ [LARGE]: 2 });
    const input = {
      ...pricingInput,
      magnetSizes: pricingInput.magnetSizes.map((s) =>
        s.id === LARGE ? { ...s, enabled: false } : s,
      ),
    };
    const eligible = filterRuntimeEligiblePromotions({
      promotions: [promo("p", [{ magnetSizeId: LARGE, quantity: 2 }], 12_000)],
      pricingInput: input,
      inventory: inv,
    });
    assert.equal(eligible.length, 0);
  });

  it("7: bundle not strictly cheaper than catalog — excluded", () => {
    const inv = inventory({ [LARGE]: 2 });
    const eligible = filterRuntimeEligiblePromotions({
      promotions: [
        promo("p", [{ magnetSizeId: LARGE, quantity: 2 }], 8_900 * 2),
      ],
      pricingInput,
      inventory: inv,
    });
    assert.equal(eligible.length, 0);
  });
});
