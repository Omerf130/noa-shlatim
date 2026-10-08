import { randomUUID } from "node:crypto";
import { connectDb } from "@/lib/db/connect";
import {
  buildAddCartItemSuccessDto,
  type AddCartItemSuccessDto,
} from "@/lib/cart/addCartItemResponse";
import { cartItemArtworkPath, cartItemOriginalPath } from "@/lib/cart/cartBlobPaths";
import { buildCartItemForPersistence } from "@/lib/cart/buildCartItemForPersistence";
import {
  cartPushItemFilter,
  findCartItemByAddIdempotencyKey,
} from "@/lib/cart/cartItemIdempotency";
import { cleanupExpiredSignAssetStaging } from "@/lib/signAssetStaging/cleanupExpiredSignAssetStaging";
import {
  SIGN_ASSET_STAGING_STALE_LOCK_MS,
} from "@/lib/signAssetStaging/stagingConfig";
import { hashSignAssetStagingToken } from "@/lib/signAssetStaging/signAssetStagingToken";
import { OrderError } from "@/lib/orders/errors";
import type { OrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";
import { validateDesignForPurchase } from "@/lib/orders/validateDesignForPurchase";
import {
  validateFinalArtworkPngBuffer,
  validateOriginalImageBuffer,
} from "@/lib/orders/validateOrderAssets";
import { copyPrivateBlobPath } from "@/lib/storage/copyPrivateBlob";
import { deletePrivateBlobPaths } from "@/lib/storage/privateBlob";
import { readPrivateBlobBuffer } from "@/lib/storage/readPrivateBlobBuffer";
import { Cart, type CartStoredAsset } from "@/models/Cart";
import { SignAssetStaging } from "@/models/SignAssetStaging";

export type AddCartItemFromStagingInput = {
  cartId: string;
  addIdempotencyKey: string;
  design: OrderDesignSnapshot;
  signAssetStagingToken: string;
  maxAssetBytes: number;
};

export type AddCartItemFromStagingResult = AddCartItemSuccessDto;

function successFromExisting(
  cartId: string,
  lineId: string,
  items: { quantity?: number }[] | undefined | null,
): AddCartItemFromStagingResult {
  return buildAddCartItemSuccessDto({
    cartId,
    lineId,
    items: items ?? [],
    reused: true,
  });
}

function extensionFromPathname(pathname: string): string {
  const base = pathname.split("/").pop() ?? "";
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot >= base.length - 1) {
    return "bin";
  }
  return base.slice(dot + 1);
}

async function acquireStagingCommitLock(params: {
  tokenHash: string;
  cartId: string;
  addIdempotencyKey: string;
}): Promise<{ stagingId: string }> {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - SIGN_ASSET_STAGING_STALE_LOCK_MS);

  const row = await SignAssetStaging.findOne({ tokenHash: params.tokenHash }).lean();
  if (!row) {
    throw new OrderError("STAGING_INVALID", "Staging not found", 400);
  }
  if (row.consumedAt) {
    throw new OrderError("STAGING_UNAVAILABLE", "Staging already used", 409);
  }
  if (row.expiresAt <= now) {
    throw new OrderError("STAGING_EXPIRED", "Staging expired", 410);
  }

  if (
    row.inProgressAt &&
    row.inProgressAt > staleBefore &&
    row.inProgressCartId === params.cartId &&
    row.inProgressAddIdempotencyKey === params.addIdempotencyKey
  ) {
    return { stagingId: row.stagingId };
  }

  if (row.inProgressAt && row.inProgressAt > staleBefore) {
    throw new OrderError("STAGING_IN_PROGRESS", "Staging commit in progress", 409);
  }

  const locked = await SignAssetStaging.findOneAndUpdate(
    {
      tokenHash: params.tokenHash,
      consumedAt: null,
      expiresAt: { $gt: now },
      $or: [
        { inProgressAt: null },
        { inProgressAt: { $lte: staleBefore } },
      ],
    },
    {
      $set: {
        inProgressAt: now,
        inProgressCartId: params.cartId,
        inProgressAddIdempotencyKey: params.addIdempotencyKey,
      },
    },
    { new: true },
  ).lean();

  if (!locked) {
    throw new OrderError("STAGING_UNAVAILABLE", "Staging unavailable", 409);
  }

  return { stagingId: locked.stagingId };
}

async function clearStagingCommitLock(tokenHash: string): Promise<void> {
  await SignAssetStaging.updateOne(
    { tokenHash },
    {
      $set: {
        inProgressAt: null,
        inProgressCartId: null,
        inProgressAddIdempotencyKey: null,
      },
    },
  );
}

async function finalizeStagingConsumed(tokenHash: string): Promise<void> {
  await SignAssetStaging.updateOne(
    { tokenHash },
    {
      $set: {
        consumedAt: new Date(),
        inProgressAt: null,
        inProgressCartId: null,
        inProgressAddIdempotencyKey: null,
      },
    },
  );
}

export async function addCartItemFromStaging(
  input: AddCartItemFromStagingInput,
): Promise<AddCartItemFromStagingResult> {
  await connectDb();
  await cleanupExpiredSignAssetStaging();

  const tokenHash = hashSignAssetStagingToken(input.signAssetStagingToken);

  const cartLean = await Cart.findOne({ _id: input.cartId, status: "active" }).lean();
  if (!cartLean) {
    throw new OrderError("ORDER_PERSIST_FAILED", "Cart unavailable", 500);
  }

  const existingEarly = findCartItemByAddIdempotencyKey(
    cartLean.items,
    input.addIdempotencyKey,
  );
  if (existingEarly) {
    return successFromExisting(
      input.cartId,
      existingEarly.lineId,
      cartLean.items,
    );
  }

  await acquireStagingCommitLock({
    tokenHash,
    cartId: input.cartId,
    addIdempotencyKey: input.addIdempotencyKey,
  });

  const stagingRow = await SignAssetStaging.findOne({ tokenHash }).lean();
  if (!stagingRow) {
    throw new OrderError("STAGING_INVALID", "Staging not found", 400);
  }

  let cartUploadedPathnames: string[] = [];

  try {
    await validateDesignForPurchase(input.design);

    const originalRead = await readPrivateBlobBuffer(stagingRow.originalPathname);
    const artworkRead = await readPrivateBlobBuffer(stagingRow.artworkPathname);
    if (!originalRead || !artworkRead) {
      throw new OrderError("STORAGE_FAILED", "Staging assets missing", 500);
    }

    const originalMeta = await validateOriginalImageBuffer(
      originalRead.buffer,
      input.maxAssetBytes,
    );
    await validateFinalArtworkPngBuffer(artworkRead.buffer, input.maxAssetBytes);

    const lineId = randomUUID();
    const ext = extensionFromPathname(stagingRow.originalPathname);

    const destOriginal = cartItemOriginalPath(input.cartId, lineId, ext);
    const destArtwork = cartItemArtworkPath(input.cartId, lineId);

    const originalCopied = await copyPrivateBlobPath({
      sourcePathname: stagingRow.originalPathname,
      destinationPathname: destOriginal,
      contentTypeFallback: originalMeta.mime,
    });
    cartUploadedPathnames.push(originalCopied.pathname);

    const artworkCopied = await copyPrivateBlobPath({
      sourcePathname: stagingRow.artworkPathname,
      destinationPathname: destArtwork,
      contentTypeFallback: "image/png",
    });
    cartUploadedPathnames.push(artworkCopied.pathname);

    const originalAsset: CartStoredAsset = {
      pathname: originalCopied.pathname,
      contentType: originalCopied.contentType,
      sizeBytes: originalCopied.sizeBytes,
    };
    const finalAsset: CartStoredAsset = {
      pathname: artworkCopied.pathname,
      contentType: artworkCopied.contentType,
      sizeBytes: artworkCopied.sizeBytes,
    };

    const newItem = buildCartItemForPersistence({
      lineId,
      addIdempotencyKey: input.addIdempotencyKey,
      design: input.design,
      originalImage: originalAsset,
      finalArtwork: finalAsset,
    });

    const updated = await Cart.findOneAndUpdate(
      cartPushItemFilter(input.cartId, input.addIdempotencyKey),
      { $push: { items: newItem } },
      { new: true },
    ).lean();

    if (!updated) {
      const afterRace = await Cart.findOne({ _id: input.cartId, status: "active" }).lean();
      const existing = findCartItemByAddIdempotencyKey(
        afterRace?.items,
        input.addIdempotencyKey,
      );
      await deletePrivateBlobPaths(cartUploadedPathnames);
      cartUploadedPathnames = [];

      if (existing) {
        await clearStagingCommitLock(tokenHash);
        return successFromExisting(input.cartId, existing.lineId, afterRace?.items);
      }
      await clearStagingCommitLock(tokenHash);
      throw new OrderError("ORDER_PERSIST_FAILED", "Cart persist failed", 500);
    }

    await finalizeStagingConsumed(tokenHash);
    await deletePrivateBlobPaths([
      stagingRow.originalPathname,
      stagingRow.artworkPathname,
    ]);

    return buildAddCartItemSuccessDto({
      cartId: input.cartId,
      lineId,
      items: updated.items ?? [],
    });
  } catch (err) {
    if (cartUploadedPathnames.length > 0) {
      await deletePrivateBlobPaths(cartUploadedPathnames);
    }
    await clearStagingCommitLock(tokenHash);

    if (err instanceof OrderError) {
      throw err;
    }
    console.error("[cart/items] staging commit failed", {
      cartId: input.cartId,
      err,
    });
    throw new OrderError("STORAGE_FAILED", "Storage failed", 500);
  }
}
