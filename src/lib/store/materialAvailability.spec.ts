import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertMaterialEnabledForNewOrder,
  isPricingReady,
  MaterialNotAvailableError,
  normalizeMaterialAvailability,
} from "@/lib/store/materialAvailability";

describe("normalizeMaterialAvailability", () => {
  it("defaults both enabled when fields missing", () => {
    const a = normalizeMaterialAvailability({});
    assert.equal(a.woodEnabled, true);
    assert.equal(a.magnetEnabled, true);
  });
});

describe("isPricingReady", () => {
  it("both on requires both prices", () => {
    assert.equal(
      isPricingReady({ woodPriceMinor: 100, magnetPriceMinor: 200, woodEnabled: true, magnetEnabled: true }),
      true,
    );
  });

  it("wood off + magnet on only requires magnet price", () => {
    assert.equal(
      isPricingReady({
        woodPriceMinor: null,
        magnetPriceMinor: 200,
        woodEnabled: false,
        magnetEnabled: true,
      }),
      true,
    );
  });

  it("enabled material missing price fails", () => {
    assert.equal(
      isPricingReady({
        woodPriceMinor: null,
        magnetPriceMinor: 200,
        woodEnabled: true,
        magnetEnabled: true,
      }),
      false,
    );
  });

  it("both disabled fails readiness", () => {
    assert.equal(
      isPricingReady({
        woodPriceMinor: 100,
        magnetPriceMinor: 200,
        woodEnabled: false,
        magnetEnabled: false,
      }),
      false,
    );
  });
});

describe("assertMaterialEnabledForNewOrder", () => {
  it("rejects disabled wood", () => {
    assert.throws(
      () =>
        assertMaterialEnabledForNewOrder("wood", {
          woodEnabled: false,
          magnetEnabled: true,
        }),
      MaterialNotAvailableError,
    );
  });
});
