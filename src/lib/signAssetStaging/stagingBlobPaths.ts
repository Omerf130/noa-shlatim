import { randomUUID } from "node:crypto";

const STAGING_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function newSignAssetStagingId(): string {
  return randomUUID();
}

export function assertValidSignAssetStagingId(stagingId: string): void {
  if (!STAGING_ID.test(stagingId)) {
    throw new Error("Invalid staging id");
  }
}

export function signAssetStagingOriginalPath(
  stagingId: string,
  ext: string,
): string {
  assertValidSignAssetStagingId(stagingId);
  const safeExt = ext.replace(/[^a-z0-9]/gi, "");
  if (!safeExt) {
    throw new Error("Invalid extension");
  }
  return `staging/sign-assets/${stagingId}/original.${safeExt}`;
}

export function signAssetStagingArtworkPath(stagingId: string): string {
  assertValidSignAssetStagingId(stagingId);
  return `staging/sign-assets/${stagingId}/artwork.png`;
}

export function signAssetStagingBlobPathnames(
  stagingId: string,
  originalExt: string,
): string[] {
  return [
    signAssetStagingOriginalPath(stagingId, originalExt),
    signAssetStagingArtworkPath(stagingId),
  ];
}
