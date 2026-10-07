import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertMaterialEnabledForNewOrder,
  isPricingReady,
  MaterialNotAvailableError,
} from "@/lib/store/materialAvailability";
import { assertMagnetSizeForNewOrder } from "@/lib/store/materialAvailability";
import { MagnetSizeNotAvailableError } from "@/lib/store/magnetSizes";

describe("isPricingReady", () => {
  it("returns true when enabled materials have prices", () => {
    assert.equal(
      isPricingReady({
        woodPriceMinor: 100,
        magnetPriceMinor: 200,
        woodEnabled: true,
        magnetEnabled: true,
        magnetSizes: [],
      }),
      true,
    );
  });

  it("returns true when only magnet enabled with legacy price", () => {
    assert.equal(
      isPricingReady({
        woodPriceMinor: null,
        magnetPriceMinor: 200,
        woodEnabled: false,
        magnetEnabled: true,
        magnetSizes: [],
      }),
      true,
    );
  });

  it("returns true when magnet uses persisted sizes", () => {
    assert.equal(
      isPricingReady({
        woodPriceMinor: 100,
        woodEnabled: true,
        magnetEnabled: true,
        magnetSizes: [
          {
            id: "a",
            name: "מגנט",
            dimensionsLabel: "",
            priceMinor: 200,
            enabled: true,
            sortOrder: 0,
          },
        ],
      }),
      true,
    );
  });

  it("returns false when enabled magnet has no usable sizes", () => {
    assert.equal(
      isPricingReady({
        woodPriceMinor: 100,
        woodEnabled: true,
        magnetEnabled: true,
        magnetSizes: [],
        magnetPriceMinor: null,
      }),
      false,
    );
  });
});

describe("assertMaterialEnabledForNewOrder", () => {
  it("throws when material disabled", () => {
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

describe("assertMagnetSizeForNewOrder", () => {
  it("throws for missing size", () => {
    assert.throws(
      () =>
        assertMagnetSizeForNewOrder(null, {
          magnetEnabled: true,
          magnetPriceMinor: 100,
          magnetSizes: [],
        }),
      MagnetSizeNotAvailableError,
    );
  });
});
