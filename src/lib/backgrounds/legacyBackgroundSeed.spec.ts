import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LEGACY_BACKGROUND_SEEDS } from "@/lib/backgrounds/legacyBackgroundSeed";

const EXPECTED_IDS = [
  "bg-garden-courtyard",
  "bg-terrace-view",
  "bg-sunset-balcony",
  "bg-tropical-beach",
  "bg-sunset-beach",
  "bg-warm-living-room",
  "bg-mediterranean-courtyard",
  "bg-camping-nature",
] as const;

describe("LEGACY_BACKGROUND_SEEDS", () => {
  it("defines exactly 8 canonical backgrounds", () => {
    assert.equal(LEGACY_BACKGROUND_SEEDS.length, 8);
  });

  it("keeps stable background IDs", () => {
    const ids = LEGACY_BACKGROUND_SEEDS.map((s) => s.id);
    assert.deepEqual(ids, [...EXPECTED_IDS]);
  });

  it("uses public storage and /backgrounds paths", () => {
    for (const seed of LEGACY_BACKGROUND_SEEDS) {
      assert.equal(seed.storageKind, "public");
      assert.match(seed.imageSrc, /^\/backgrounds\//);
    }
  });

  it("assigns unique sort orders", () => {
    const orders = LEGACY_BACKGROUND_SEEDS.map((s) => s.sortOrder);
    assert.equal(new Set(orders).size, orders.length);
  });
});
