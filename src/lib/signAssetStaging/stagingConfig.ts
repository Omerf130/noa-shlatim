/** Default time a staged sign-asset session remains valid for add-to-cart. */
export function signAssetStagingTtlMs(): number {
  const hours = Number(process.env.SIGN_ASSET_STAGING_TTL_HOURS ?? "72");
  if (!Number.isFinite(hours) || hours <= 0) {
    return 72 * 60 * 60 * 1000;
  }
  return hours * 60 * 60 * 1000;
}

/** Commit lock older than this may be reclaimed after a partial failure. */
export const SIGN_ASSET_STAGING_STALE_LOCK_MS = 10 * 60 * 1000;

/** Max expired staging rows cleaned up per create (no paid cron). */
export const SIGN_ASSET_STAGING_CLEANUP_BATCH = 20;

/**
 * Vercel serverless request bodies are capped (~4.5 MB). generate-final still
 * receives multipart (source image + composition JPEG). Client allows up to
 * maxImageUploadBytes() per file — combined multipart may exceed the platform
 * cap before this handler runs. Add-to-cart avoids that by JSON + staged blobs.
 */
export function vercelRouteHandlerBodyLimitNote(): string {
  return "Platform request body limit applies to POST /api/signs/generate-final multipart uploads.";
}
