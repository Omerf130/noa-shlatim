import { connectDb } from "@/lib/db/connect";
import { deletePrivateBlobPaths } from "@/lib/storage/privateBlob";
import { SignAssetStaging } from "@/models/SignAssetStaging";
import { SIGN_ASSET_STAGING_CLEANUP_BATCH } from "@/lib/signAssetStaging/stagingConfig";

/**
 * Best-effort cleanup without cron: run during staging create / commit.
 * Deletes blob files and Mongo rows for expired, unconsumed sessions.
 */
export async function cleanupExpiredSignAssetStaging(): Promise<number> {
  await connectDb();
  const now = new Date();

  const expired = await SignAssetStaging.find({
    expiresAt: { $lt: now },
    consumedAt: null,
  })
    .sort({ expiresAt: 1 })
    .limit(SIGN_ASSET_STAGING_CLEANUP_BATCH)
    .lean();

  let removed = 0;
  for (const row of expired) {
    const paths = [row.originalPathname, row.artworkPathname].filter(Boolean);
    await deletePrivateBlobPaths(paths);
    const deleted = await SignAssetStaging.deleteOne({ _id: row._id });
    if (deleted.deletedCount === 1) {
      removed += 1;
    }
  }
  return removed;
}
