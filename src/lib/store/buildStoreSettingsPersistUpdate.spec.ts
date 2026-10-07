import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildStoreSettingsPersistUpdate } from "./buildStoreSettingsPersistUpdate";

type PricingDoc = {
  woodPriceMinor?: number | null;
  magnetPriceMinor?: number | null;
  woodEnabled?: boolean;
  magnetEnabled?: boolean;
};

function applyPricingSet(
  existing: PricingDoc,
  update: ReturnType<typeof buildStoreSettingsPersistUpdate>,
): PricingDoc {
  return {
    ...existing,
    woodPriceMinor: update["pricing.woodPriceMinor"],
    magnetPriceMinor: update["pricing.magnetPriceMinor"],
  };
}

describe("buildStoreSettingsPersistUpdate", () => {
  const baseSave = {
    woodPriceMinor: 12_000,
    magnetPriceMinor: 9_000,
    shippingMethods: [],
  };

  it("uses dotted pricing paths so enabled flags are not replaced", () => {
    const update = buildStoreSettingsPersistUpdate(baseSave);
    assert.equal(update["pricing.woodPriceMinor"], 12_000);
    assert.equal(update["pricing.magnetPriceMinor"], 9_000);
    assert.equal("pricing" in update, false);
  });

  it("keeps magnetEnabled false after price save semantics", () => {
    const existing: PricingDoc = {
      woodEnabled: true,
      magnetEnabled: false,
      woodPriceMinor: 10_000,
      magnetPriceMinor: 8_000,
    };
    const after = applyPricingSet(
      existing,
      buildStoreSettingsPersistUpdate({
        ...baseSave,
        magnetPriceMinor: 9_500,
      }),
    );
    assert.equal(after.magnetEnabled, false);
    assert.equal(after.magnetPriceMinor, 9_500);
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
