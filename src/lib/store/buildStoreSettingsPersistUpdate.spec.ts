import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildStoreSettingsPersistUpdate } from "./buildStoreSettingsPersistUpdate";

type PricingDoc = {
  woodPriceMinor?: number | null;
  magnetPriceMinor?: number | null;
  woodEnabled?: boolean;
  magnetEnabled?: boolean;
  magnetSizes?: unknown[];
};

function applyPricingSet(
  existing: PricingDoc,
  update: ReturnType<typeof buildStoreSettingsPersistUpdate>,
): PricingDoc {
  return {
    ...existing,
    woodPriceMinor: update["pricing.woodPriceMinor"],
  };
}

describe("buildStoreSettingsPersistUpdate", () => {
  const baseSave = {
    woodPriceMinor: 12_000,
    shippingMethods: [],
  };

  it("uses dotted wood pricing path only so other pricing fields are preserved", () => {
    const update = buildStoreSettingsPersistUpdate(baseSave);
    assert.equal(update["pricing.woodPriceMinor"], 12_000);
    assert.equal("pricing.magnetPriceMinor" in update, false);
    assert.equal("pricing" in update, false);
    assert.equal("magnetSizes" in update, false);
  });

  it("keeps magnetEnabled false after price save semantics", () => {
    const existing: PricingDoc = {
      woodEnabled: true,
      magnetEnabled: false,
      woodPriceMinor: 10_000,
      magnetPriceMinor: 8_000,
      magnetSizes: [{ id: "x" }],
    };
    const after = applyPricingSet(
      existing,
      buildStoreSettingsPersistUpdate({
        ...baseSave,
        woodPriceMinor: 11_000,
      }),
    );
    assert.equal(after.magnetEnabled, false);
    assert.equal(after.magnetPriceMinor, 8_000);
    assert.equal(after.magnetSizes?.length, 1);
    assert.equal(after.woodEnabled, true);
  });

  it("keeps woodEnabled false after price save semantics", () => {
    const existing: PricingDoc = {
      woodEnabled: false,
      magnetEnabled: true,
      woodPriceMinor: 10_000,
      magnetPriceMinor: 8_000,
    };
    const after = applyPricingSet(
      existing,
      buildStoreSettingsPersistUpdate({
        ...baseSave,
        woodPriceMinor: 11_000,
      }),
    );
    assert.equal(after.woodEnabled, false);
    assert.equal(after.woodPriceMinor, 11_000);
    assert.equal(after.magnetEnabled, true);
  });
});
