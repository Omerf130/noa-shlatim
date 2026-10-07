import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  defaultMagnetSizeIdForCatalog,
  resolveSyncedMagnetSizeId,
} from "@/lib/builder/magnetSizeSelection";

const sizes = [
  {
    id: "size-1",
    name: "א",
    dimensionsLabel: "",
    priceMinor: 100,
    displayPrice: "₪1",
  },
  {
    id: "size-2",
    name: "ב",
    dimensionsLabel: "",
    priceMinor: 200,
    displayPrice: "₪2",
  },
];

describe("magnetSizeSelection", () => {
  it("auto-selects when one enabled size", () => {
    assert.equal(defaultMagnetSizeIdForCatalog([sizes[0]!]), "size-1");
    assert.equal(
      resolveSyncedMagnetSizeId(null, "magnet", [sizes[0]!]),
      "size-1",
    );
  });

  it("requires explicit selection when multiple sizes", () => {
    assert.equal(defaultMagnetSizeIdForCatalog(sizes), null);
    assert.equal(resolveSyncedMagnetSizeId(null, "magnet", sizes), null);
    assert.equal(resolveSyncedMagnetSizeId("size-2", "magnet", sizes), "size-2");
  });

  it("clears when switching to wood", () => {
    assert.equal(resolveSyncedMagnetSizeId("size-1", "wood", sizes), null);
  });

  it("clears invalid selection from catalog", () => {
    assert.equal(
      resolveSyncedMagnetSizeId("removed", "magnet", [sizes[0]!]),
      "size-1",
    );
    assert.equal(resolveSyncedMagnetSizeId("removed", "magnet", sizes), null);
  });
});
