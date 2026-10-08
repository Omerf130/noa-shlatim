import { connectDb } from "@/lib/db/connect";
import { cleanupExpiredSignAssetStaging } from "@/lib/signAssetStaging/cleanupExpiredSignAssetStaging";
import {
  newSignAssetStagingId,
  signAssetStagingArtworkPath,
  signAssetStagingOriginalPath,
} from "@/lib/signAssetStaging/stagingBlobPaths";
import { signAssetStagingTtlMs } from "@/lib/signAssetStaging/stagingConfig";
import {
  generateSignAssetStagingToken,
  hashSignAssetStagingToken,
} from "@/lib/signAssetStaging/signAssetStagingToken";
import { deletePrivateBlobPaths, putPrivateBlob } from "@/lib/storage/privateBlob";
import { SignAssetStaging } from "@/models/SignAssetStaging";
import { OrderError } from "@/lib/orders/errors";
import {
  validateFinalArtworkPngBuffer,
  validateOriginalImageBuffer,
} from "@/lib/orders/validateOrderAssets";

export type CreateSignAssetStagingInput = {
  originalBuffer: Buffer;
  finalArtworkBuffer: Buffer;
  maxAssetBytes: number;
};

export type CreateSignAssetStagingResult = {
  signAssetStagingToken: string;
};

export async function createSignAssetStaging(
  input: CreateSignAssetStagingInput,
): Promise<CreateSignAssetStagingResult> {
  await connectDb();
  await cleanupExpiredSignAssetStaging();

  const originalMeta = await validateOriginalImageBuffer(
    input.originalBuffer,
    input.maxAssetBytes,
  );
  await validateFinalArtworkPngBuffer(input.finalArtworkBuffer, input.maxAssetBytes);

  const stagingId = newSignAssetStagingId();
  const { token, tokenHash } = generateSignAssetStagingToken();
  const uploadedPathnames: string[] = [];

  try {
    const originalPath = signAssetStagingOriginalPath(stagingId, originalMeta.ext);
    const originalStored = await putPrivateBlob(originalPath, input.originalBuffer, {
      contentType: originalMeta.mime,
    });
    uploadedPathnames.push(originalStored.pathname);

    const artworkPath = signAssetStagingArtworkPath(stagingId);
    const artworkStored = await putPrivateBlob(
      artworkPath,
      input.finalArtworkBuffer,
      { contentType: "image/png" },
    );
    uploadedPathnames.push(artworkStored.pathname);

    const expiresAt = new Date(Date.now() + signAssetStagingTtlMs());

    await SignAssetStaging.create({
      tokenHash,
      stagingId,
      originalPathname: originalStored.pathname,
      artworkPathname: artworkStored.pathname,
      originalContentType: originalMeta.mime,
      originalSizeBytes: input.originalBuffer.length,
      artworkSizeBytes: input.finalArtworkBuffer.length,
      expiresAt,
      consumedAt: null,
      inProgressAt: null,
    });

    return { signAssetStagingToken: token };
  } catch (err) {
    await deletePrivateBlobPaths(uploadedPathnames);
    if (err instanceof OrderError) {
      throw err;
    }
    console.error("[signAssetStaging] create failed", { stagingId, err });
    throw new OrderError("STORAGE_FAILED", "Staging storage failed", 500);
  }
}

/** Release unconsumed staging when the customer generates again. */
export async function releaseSignAssetStagingByToken(token: string): Promise<void> {
  const tokenHash = hashSignAssetStagingToken(token);
  await connectDb();

  const row = await SignAssetStaging.findOne({ tokenHash, consumedAt: null }).lean();
  if (!row) {
    return;
  }

  await deletePrivateBlobPaths([row.originalPathname, row.artworkPathname]);
  await SignAssetStaging.deleteOne({ _id: row._id });
}
