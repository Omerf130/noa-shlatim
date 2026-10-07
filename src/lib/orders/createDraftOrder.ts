import mongoose from "mongoose";
import { connectDb } from "@/lib/db/connect";
import type { OrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";
import { validateDesignForPurchase } from "@/lib/orders/validateDesignForPurchase";
import { OrderError } from "@/lib/orders/errors";
import { orderArtworkPath, orderOriginalPath } from "@/lib/orders/orderBlobPaths";
import {
  validateFinalArtworkPngBuffer,
  validateOriginalImageBuffer,
} from "@/lib/orders/validateOrderAssets";
import {
  generateCheckoutAccessToken,
  hashCheckoutAccessToken,
} from "@/lib/checkout/checkoutAccessToken";
import { deletePrivateBlob, putPrivateBlob } from "@/lib/storage/privateBlob";
import { Order, type OrderStoredAsset } from "@/models/Order";

const CREATING_STALE_MS = 5 * 60 * 1000;

function isDraftComplete(order: {
  status: string;
  assets?: { originalImage?: unknown; finalArtwork?: unknown };
}): boolean {
  return (
    order.status === "draft" &&
    Boolean(order.assets?.originalImage) &&
    Boolean(order.assets?.finalArtwork)
  );
}

async function deleteUploaded(pathnames: string[]): Promise<void> {
  for (const pathname of pathnames) {
    try {
      await deletePrivateBlob(pathname);
    } catch (err) {
      console.error("[orders/draft] blob cleanup failed", { pathname, err });
    }
  }
}

async function resolveExistingIdempotency(
  draftIdempotencyKey: string,
): Promise<{ orderId: string; reused: true } | null> {
  const existing = await Order.findOne({ draftIdempotencyKey }).lean();
  if (!existing) {
    return null;
  }

  if (isDraftComplete(existing)) {
    return { orderId: existing._id.toString(), reused: true };
  }

  if (existing.status === "creating") {
    const updatedAt =
      existing.updatedAt instanceof Date
        ? existing.updatedAt.getTime()
        : Date.now();
    if (Date.now() - updatedAt < CREATING_STALE_MS) {
      throw new OrderError("ORDER_IN_PROGRESS", "Order in progress", 409);
    }
    await Order.deleteOne({ _id: existing._id });
    return null;
  }

  return null;
}

async function claimOrderCreation(params: {
  draftIdempotencyKey: string;
  design: OrderDesignSnapshot;
}): Promise<{ orderId: string; reused: boolean }> {
  const orderId = new mongoose.Types.ObjectId();

  try {
    await Order.create({
      _id: orderId,
      status: "creating",
      creationMode: params.design.creationMode,
      draftIdempotencyKey: params.draftIdempotencyKey,
      design: params.design,
      assets: {},
    });
    return { orderId: orderId.toString(), reused: false };
  } catch (err) {
    const isDuplicate =
      err instanceof Error &&
      "code" in err &&
      (err as { code?: number }).code === 11000;

    if (isDuplicate) {
      const resolved = await resolveExistingIdempotency(params.draftIdempotencyKey);
      if (resolved) {
        return { orderId: resolved.orderId, reused: true };
      }
      throw new OrderError("ORDER_IN_PROGRESS", "Order in progress", 409);
    }
    throw err;
  }
}

export type CreateDraftOrderInput = {
  draftIdempotencyKey: string;
  design: OrderDesignSnapshot;
  originalBuffer: Buffer;
  finalArtworkBuffer: Buffer;
  maxAssetBytes: number;
};

export type CreateDraftOrderResult = {
  orderId: string;
  reused: boolean;
  /** Present only when a new draft was finalized with a freshly issued token. */
  checkoutToken?: string;
};

export async function createDraftOrder(
  input: CreateDraftOrderInput,
): Promise<CreateDraftOrderResult> {
  await connectDb();

  await validateDesignForPurchase(input.design);

  const reusedEarly = await resolveExistingIdempotency(input.draftIdempotencyKey);
  if (reusedEarly) {
    return reusedEarly;
  }

  const originalMeta = await validateOriginalImageBuffer(
    input.originalBuffer,
    input.maxAssetBytes,
  );
  await validateFinalArtworkPngBuffer(input.finalArtworkBuffer, input.maxAssetBytes);

  const claim = await claimOrderCreation({
    draftIdempotencyKey: input.draftIdempotencyKey,
    design: input.design,
  });

  if (claim.reused) {
    return { orderId: claim.orderId, reused: true };
  }

  const orderId = claim.orderId;
  const uploadedPathnames: string[] = [];

  try {
    const originalPath = orderOriginalPath(orderId, originalMeta.ext);
    const artworkPath = orderArtworkPath(orderId);

    const originalStored = await putPrivateBlob(originalPath, input.originalBuffer, {
      contentType: originalMeta.mime,
    });
    uploadedPathnames.push(originalStored.pathname);

    const artworkStored = await putPrivateBlob(artworkPath, input.finalArtworkBuffer, {
      contentType: "image/png",
    });
    uploadedPathnames.push(artworkStored.pathname);

    const originalAsset: OrderStoredAsset = {
      pathname: originalStored.pathname,
      contentType: originalMeta.mime,
      sizeBytes: input.originalBuffer.length,
    };
    const finalAsset: OrderStoredAsset = {
      pathname: artworkStored.pathname,
      contentType: "image/png",
      sizeBytes: input.finalArtworkBuffer.length,
    };

    const checkoutToken = generateCheckoutAccessToken();
    const checkoutAccessTokenHash = hashCheckoutAccessToken(checkoutToken);

    const updated = await Order.findOneAndUpdate(
      { _id: orderId, status: "creating" },
      {
        $set: {
          status: "draft",
          assets: {
            originalImage: originalAsset,
            finalArtwork: finalAsset,
          },
          checkoutAccessTokenHash,
        },
      },
      { new: true },
    );

    if (!updated) {
      throw new OrderError("ORDER_PERSIST_FAILED", "Finalize failed", 500);
    }

    return { orderId, reused: false, checkoutToken };
  } catch (err) {
    await deleteUploaded(uploadedPathnames);
    try {
      await Order.deleteOne({ _id: orderId, status: "creating" });
    } catch (deleteErr) {
      console.error("[orders/draft] order cleanup failed", { orderId, deleteErr });
    }

    if (err instanceof OrderError) {
      throw err;
    }
    console.error("[orders/draft] create failed", { orderId, err });
    throw new OrderError("STORAGE_FAILED", "Storage failed", 500);
  }
}

/** @deprecated Use createDraftOrder — kept for call-site clarity during migration. */
export const createDraftPhotoOrder = createDraftOrder;
