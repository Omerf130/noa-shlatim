import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isBackgroundSelectionValid,
  resolveSyncedBackgroundSelection,
} from "@/lib/builder/backgroundSelection";
import type { SignBackground } from "@/types/signBackground";

function bg(id: string, active = true): SignBackground {
  return {
    id,
    name: id,
    imageSrc: `/backgrounds/${id}.png`,
    alt: id,
    objectPosition: "50% 50%",
    sortOrder: 1,
    active,
  };
}

describe("resolveSyncedBackgroundSelection", () => {
  it("returns null when catalog is empty", () => {
    assert.equal(resolveSyncedBackgroundSelection("bg-a", []), null);
  });

  it("auto-selects when exactly one enabled background", () => {
    const catalog = [bg("bg-only")];
    assert.equal(resolveSyncedBackgroundSelection(null, catalog), "bg-only");
  });

  it("keeps valid current selection", () => {
    const catalog = [bg("bg-a"), bg("bg-b")];
    assert.equal(resolveSyncedBackgroundSelection("bg-b", catalog), "bg-b");
  });

  it("clears stale disabled selection from catalog", () => {
    const catalog = [bg("bg-a"), bg("bg-b")];
    assert.equal(resolveSyncedBackgroundSelection("bg-removed", catalog), null);
  });
});

describe("isBackgroundSelectionValid", () => {
  it("requires a background in the customer catalog", () => {
    const catalog = [bg("bg-a")];
    assert.equal(isBackgroundSelectionValid("bg-a", catalog), true);
    assert.equal(isBackgroundSelectionValid("bg-disabled", catalog), false);
    assert.equal(isBackgroundSelectionValid(null, catalog), false);
  });
});
