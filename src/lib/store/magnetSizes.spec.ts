import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isLegacyMagnetBridgeActive,
  isMagnetPurchasable,
  isMagnetSizeCustomerReady,
  LEGACY_MAGNET_SIZE_ID,
  listCustomerMagnetSizes,
  resolveMagnetSizeCatalog,
  resolveMagnetSizePriceMinor,
} from "@/lib/store/magnetSizes";
import { isPricingReady } from "@/lib/store/materialAvailability";
import {
  normalizeMagnetSizesSave,
} from "@/lib/store/magnetSizeAdminSchema";
import { buildCommercialSnapshotFromAmounts } from "@/lib/orders/computeOrderCommercial";
import { orderCommercialSnapshotSchema } from "@/lib/orders/commercialSnapshot";
import { resolveProductPriceMinor } from "@/lib/store/resolveProductPriceMinor";
import { buildFinbotIncomeLineItems } from "@/lib/finbot/vatLinePrices";

const sizeA = {
  id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  name: "מגנט א",
  dimensionsLabel: "10×10",
  priceMinor: 6_900,
  enabled: true,
  sortOrder: 0,
};

describe("magnet size catalog", () => {
  it("legacy bridge when no persisted sizes", () => {
    const catalog = resolveMagnetSizeCatalog({
      magnetEnabled: true,
      magnetPriceMinor: 5_000,
      magnetSizes: [],
    });
    assert.equal(catalog.length, 1);
    assert.equal(catalog[0]!.id, LEGACY_MAGNET_SIZE_ID);
    assert.equal(catalog[0]!.name, "מגנט");
    assert.equal(catalog[0]!.dimensionsLabel, "");
  });

  it("real sizes override legacy price", () => {
    const catalog = resolveMagnetSizeCatalog({
      magnetEnabled: true,
      magnetPriceMinor: 5_000,
      magnetSizes: [sizeA],
    });
    assert.equal(catalog.length, 1);
    assert.equal(catalog[0]!.id, sizeA.id);
    assert.equal(
      resolveMagnetSizePriceMinor(
        { magnetEnabled: true, magnetPriceMinor: 5_000, magnetSizes: [sizeA] },
        sizeA.id,
      ),
      6_900,
    );
  });

  it("disabled size excluded from customer catalog", () => {
    const sizes = listCustomerMagnetSizes({
      magnetEnabled: true,
      magnetSizes: [{ ...sizeA, enabled: false }],
    });
    assert.equal(sizes.length, 0);
  });

  it("magnet not purchasable without sizes or legacy", () => {
    assert.equal(
      isMagnetPurchasable({ magnetEnabled: true, magnetSizes: [] }),
      false,
    );
    assert.equal(
      isMagnetPurchasable({
        magnetEnabled: true,
        magnetPriceMinor: 100,
        magnetSizes: [],
      }),
      true,
    );
  });

  it("isPricingReady uses magnet purchasability", () => {
    assert.equal(
      isPricingReady({
        woodPriceMinor: 100,
        woodEnabled: false,
        magnetEnabled: true,
        magnetPriceMinor: 200,
        magnetSizes: [],
      }),
      true,
    );
    assert.equal(
      isPricingReady({
        woodPriceMinor: 100,
        woodEnabled: false,
        magnetEnabled: true,
        magnetSizes: [{ ...sizeA, enabled: false }],
      }),
      false,
    );
  });
});

describe("normalizeMagnetSizesSave", () => {
  it("assigns stable id for new rows", () => {
    const existing = new Set<string>();
    const result = normalizeMagnetSizesSave(
      {
        sizes: [
          {
            id: "new:",
            name: "קטן",
            dimensionsLabel: "",
            price: "69",
            enabled: true,
          },
        ],
      },
      existing,
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.match(result.sizes[0]!.id, /^[0-9a-f-]{36}$/i);
    }
  });

  it("preserves id when editing", () => {
    const existing = new Set([sizeA.id]);
    const result = normalizeMagnetSizesSave(
      {
        sizes: [
          {
            id: sizeA.id,
            name: "מגנט מעודכן",
            dimensionsLabel: "12×12",
            price: "79",
            enabled: true,
          },
        ],
      },
      existing,
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.sizes[0]!.id, sizeA.id);
      assert.equal(result.sizes[0]!.name, "מגנט מעודכן");
    }
  });

  it("reordering does not change ids", () => {
    const b = { ...sizeA, id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", sortOrder: 1 };
    const existing = new Set([sizeA.id, b.id]);
    const result = normalizeMagnetSizesSave(
      {
        sizes: [
          { id: b.id, name: b.name, dimensionsLabel: "", price: "80", enabled: true },
          { id: sizeA.id, name: sizeA.name, dimensionsLabel: "", price: "69", enabled: true },
        ],
      },
      existing,
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.sizes[0]!.id, b.id);
      assert.equal(result.sizes[1]!.id, sizeA.id);
    }
  });
});

describe("resolveProductPriceMinor", () => {
  it("wood unchanged", () => {
    assert.equal(
      resolveProductPriceMinor({
        pricing: { woodPriceMinor: 12_000, woodEnabled: true },
        material: "wood",
      }),
      12_000,
    );
  });

  it("magnet resolves selected size price", () => {
    assert.equal(
      resolveProductPriceMinor({
        pricing: { magnetEnabled: true, magnetSizes: [sizeA] },
        material: "magnet",
        magnetSizeId: sizeA.id,
      }),
      6_900,
    );
  });

  it("rejects disabled size id", () => {
    assert.throws(() =>
      resolveProductPriceMinor({
        pricing: {
          magnetEnabled: true,
          magnetSizes: [{ ...sizeA, enabled: false }],
        },
        material: "magnet",
        magnetSizeId: sizeA.id,
      }),
    );
  });
});

describe("commercial snapshot magnet fields", () => {
  it("freezes magnet labels", () => {
    const snapshot = buildCommercialSnapshotFromAmounts({
      material: "magnet",
      productAmountMinor: 6_900,
      shippingMethodId: "s1",
      shippingLabel: "איסוף",
      shippingAmountMinor: 0,
      totalAmountMinor: 6_900,
      magnetSizeId: sizeA.id,
      magnetSizeName: sizeA.name,
      magnetSizeDimensionsLabel: sizeA.dimensionsLabel,
    });
    assert.equal(snapshot.magnetSizeName, sizeA.name);
    assert.equal(orderCommercialSnapshotSchema.safeParse(snapshot).success, true);
  });

  it("legacy snapshots without magnet fields still parse", () => {
    assert.equal(
      orderCommercialSnapshotSchema.safeParse({
        currency: "ILS",
        capturedAt: "2026-01-01T00:00:00.000Z",
        material: "magnet",
        productAmountMinor: 100,
        shippingMethodId: "x",
        shippingLabel: "משלוח",
        shippingAmountMinor: 0,
        totalAmountMinor: 100,
      }).success,
      true,
    );
  });
});

describe("Finbot magnet description", () => {
  it("includes frozen size in product line", () => {
    const snapshot = buildCommercialSnapshotFromAmounts({
      material: "magnet",
      productAmountMinor: 9_000,
      shippingMethodId: "s1",
      shippingLabel: "איסוף",
      shippingAmountMinor: 0,
      totalAmountMinor: 9_000,
      magnetSizeId: sizeA.id,
      magnetSizeName: "מגנט קטן",
      magnetSizeDimensionsLabel: "10x15",
    });
    const lines = buildFinbotIncomeLineItems(snapshot);
    assert.match(lines[0]!.name, /מגנט קטן/);
    assert.match(lines[0]!.name, /10x15/);
  });
});

describe("legacy bridge flag", () => {
  it("active only without persisted sizes", () => {
    assert.equal(
      isLegacyMagnetBridgeActive({
        magnetEnabled: true,
        magnetPriceMinor: 100,
        magnetSizes: [],
      }),
      true,
    );
    assert.equal(
      isLegacyMagnetBridgeActive({
        magnetEnabled: true,
        magnetPriceMinor: 100,
        magnetSizes: [sizeA],
      }),
      false,
    );
  });
});

describe("isMagnetSizeCustomerReady", () => {
  it("requires name and price when enabled", () => {
    assert.equal(isMagnetSizeCustomerReady(sizeA), true);
    assert.equal(
      isMagnetSizeCustomerReady({ ...sizeA, name: "  " }),
      false,
    );
  });
});
