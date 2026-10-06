import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  listEnabledMaterials,
  resolveSyncedMaterialSelection,
} from "@/lib/builder/materialSelection";

describe("listEnabledMaterials", () => {
  it("returns both when enabled", () => {
    assert.deepEqual(
      listEnabledMaterials({ woodEnabled: true, magnetEnabled: true }),
      ["wood", "magnet"],
    );
  });

  it("returns only magnet when wood disabled", () => {
    assert.deepEqual(
      listEnabledMaterials({ woodEnabled: false, magnetEnabled: true }),
      ["magnet"],
    );
  });
});

describe("resolveSyncedMaterialSelection", () => {
  it("auto-selects sole enabled material", () => {
    assert.equal(
      resolveSyncedMaterialSelection(null, { woodEnabled: false, magnetEnabled: true }),
      "magnet",
    );
  });

  it("clears disabled selection", () => {
    assert.equal(
      resolveSyncedMaterialSelection("wood", { woodEnabled: false, magnetEnabled: true }),
      "magnet",
    );
  });

  it("returns null when none enabled", () => {
    assert.equal(
      resolveSyncedMaterialSelection("wood", { woodEnabled: false, magnetEnabled: false }),
      null,
    );
  });
});
