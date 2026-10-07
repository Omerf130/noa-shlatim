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
import { OrderError } from "@/lib/orders/errors";
import type { OrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";
import { validateDesignForPurchase } from "@/lib/orders/validateDesignForPurchase";
import {
  validateFinalArtworkPngBuffer,
  validateOriginalImageBuffer,
} from "@/lib/orders/validateOrderAssets";
import {
  deletePrivateBlobPaths,
  putPrivateBlob,
} from "@/lib/storage/privateBlob";
import { Cart, type CartStoredAsset } from "@/models/Cart";

export type AddCartItemInput = {
  cartId: string;
  addIdempotencyKey: string;
  design: OrderDesignSnapshot;
  originalBuffer: Buffer;
  finalArtworkBuffer: Buffer;
  maxAssetBytes: number;
};

export type AddCartItemResult = AddCartItemSuccessDto;

function successFromExisting(
  cartId: string,
  lineId: string,
  items: { quantity?: number }[] | undefined | null,
): AddCartItemResult {
  return buildAddCartItemSuccessDto({
    cartId,
    lineId,
    items: items ?? [],
    reused: true,
  });
}

export async function addCartItem(input: AddCartItemInput): Promise<AddCartItemResult> {
  await connectDb();

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

  await validateDesignForPurchase(input.design);

  const originalMeta = await validateOriginalImageBuffer(
    input.originalBuffer,
    input.maxAssetBytes,
  );
  await validateFinalArtworkPngBuffer(input.finalArtworkBuffer, input.maxAssetBytes);

  const lineId = randomUUID();
  const uploadedPathnames: string[] = [];

  try {
    const originalPath = cartItemOriginalPath(
      input.cartId,
      lineId,
      originalMeta.ext,
    );
    const originalStored = await putPrivateBlob(originalPath, input.originalBuffer, {
      contentType: originalMeta.mime,
    });
    uploadedPathnames.push(originalStored.pathname);

    const artworkPath = cartItemArtworkPath(input.cartId, lineId);
    const artworkStored = await putPrivateBlob(
      artworkPath,
      input.finalArtworkBuffer,
      { contentType: "image/png" },
    );
    uploadedPathnames.push(artworkStored.pathname);

    const originalAsset: CartStoredAsset = {
      pathname: originalStored.pathname,
      contentType: originalMeta.mime,
      sizeBytes: input.originalBuffer.length,
    };
    const finalAsset: CartStoredAsset = {
      pathname: artworkStored.pathname,
      contentType: "image/png",
      sizeBytes: input.finalArtworkBuffer.length,
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
      if (existing) {
        await deletePrivateBlobPaths(uploadedPathnames);
        return successFromExisting(input.cartId, existing.lineId, afterRace?.items);
      }
      await deletePrivateBlobPaths(uploadedPathnames);
      throw new OrderError("ORDER_PERSIST_FAILED", "Cart persist failed", 500);
    }

    return buildAddCartItemSuccessDto({
      cartId: input.cartId,
      lineId,
      items: updated.items ?? [],
    });
  } catch (err) {
    await deletePrivateBlobPaths(uploadedPathnames);

    if (err instanceof OrderError) {
      throw err;
    }
    console.error("[cart/items] add failed", { cartId: input.cartId, lineId, err });
    throw new OrderError("STORAGE_FAILED", "Storage failed", 500);
  }
}
