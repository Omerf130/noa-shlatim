import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBackgroundEnabledForNewOrder } from "@/lib/backgrounds/loadBackgrounds";
import type { BackgroundLean } from "@/lib/backgrounds/backgroundCatalog";

describe("isBackgroundEnabledForNewOrder", () => {
  const row: BackgroundLean = {
    id: "bg-test",
    displayName: "Test",
    enabled: true,
    sortOrder: 1,
    imageSrc: "/backgrounds/x.png",
    storageKind: "public",
  };

  it("allows enabled backgrounds for new orders", () => {
    assert.equal(isBackgroundEnabledForNewOrder(row), true);
  });

  it("rejects disabled backgrounds for new orders", () => {
    assert.equal(isBackgroundEnabledForNewOrder({ ...row, enabled: false }), false);
  });

  it("rejects missing backgrounds for new orders", () => {
    assert.equal(isBackgroundEnabledForNewOrder(null), false);
  });
});

describe("historical render vs new-order availability", () => {
  it("disabled row still represents a persisted background ID", () => {
    const disabled: BackgroundLean = {
      id: "bg-garden-courtyard",
      displayName: "חצר",
      enabled: false,
      sortOrder: 1,
      imageSrc: "/backgrounds/a.png",
      storageKind: "public",
    };
    assert.equal(isBackgroundEnabledForNewOrder(disabled), false);
    assert.equal(disabled.id, "bg-garden-courtyard");
  });
});
