import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LEGACY_BACKGROUND_SEEDS } from "@/lib/backgrounds/legacyBackgroundSeed";
import { legacyBackgroundSetOnInsert } from "@/lib/backgrounds/seedLegacyBackgrounds";

describe("legacyBackgroundSetOnInsert", () => {
  it("maps each seed to insert-only fields", () => {
    for (const seed of LEGACY_BACKGROUND_SEEDS) {
      const doc = legacyBackgroundSetOnInsert(seed);
      assert.equal(doc.id, seed.id);
      assert.equal(doc.displayName, seed.displayName);
      assert.equal(doc.imageSrc, seed.imageSrc);
      assert.equal(doc.storageKind, "public");
      assert.equal(doc.enabled, true);
      assert.equal(doc.blobPathname, null);
    }
  });

  it("covers all eight legacy IDs", () => {
    const ids = LEGACY_BACKGROUND_SEEDS.map((s) => legacyBackgroundSetOnInsert(s).id);
    assert.equal(ids.length, 8);
    assert.equal(new Set(ids).size, 8);
  });
});
