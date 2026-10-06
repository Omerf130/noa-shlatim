import {
  LEGACY_BACKGROUND_SEEDS,
  type LegacyBackgroundSeedEntry,
} from "@/lib/backgrounds/legacyBackgroundSeed";
import { connectDb } from "@/lib/db/connect";
import { Background } from "@/models/Background";

export function legacyBackgroundSetOnInsert(seed: LegacyBackgroundSeedEntry) {
  return {
    id: seed.id,
    displayName: seed.displayName,
    enabled: true,
    sortOrder: seed.sortOrder,
    imageSrc: seed.imageSrc,
    storageKind: seed.storageKind,
    blobPathname: null,
    objectPosition: seed.objectPosition,
    alt: seed.alt,
  };
}

export type SeedLegacyBackgroundsResult = {
  inserted: number;
  skipped: number;
};

/**
 * Inserts legacy catalog rows only when missing. Never overwrites existing docs.
 */
export async function seedLegacyBackgrounds(): Promise<SeedLegacyBackgroundsResult> {
  await connectDb();

  let inserted = 0;
  let skipped = 0;

  for (const seed of LEGACY_BACKGROUND_SEEDS) {
    const result = await Background.updateOne(
      { id: seed.id },
      { $setOnInsert: legacyBackgroundSetOnInsert(seed) },
      { upsert: true },
    );

    if (result.upsertedCount > 0) {
      inserted += 1;
    } else {
      skipped += 1;
    }
  }

  return { inserted, skipped };
}
