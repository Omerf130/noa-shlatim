import mongoose from "mongoose";
import { connectDb } from "@/lib/db/connect";
import { buildCartConversionDraftIdempotencyKey } from "@/lib/cart/cartConversionDraftIdempotencyKey";
import { copyCartItemAssetsToOrder } from "@/lib/cart/copyCartItemAssetsToOrder";
import { CartError } from "@/lib/cart/cartErrors";
import {
  validateCartItemsForConversion,
  type CartLineForConversion,
} from "@/lib/cart/validateCartForConversion";
import type { CartItemDocument } from "@/models/Cart";
import {
  generateCheckoutAccessToken,
  hashCheckoutAccessToken,
} from "@/lib/checkout/checkoutAccessToken";
import { OrderError } from "@/lib/orders/errors";
import { parseCartLineDesign } from "@/lib/cart/parseCartLineDesign";
import { deletePrivateBlobPaths } from "@/lib/storage/privateBlob";
import { Cart } from "@/models/Cart";
import { Order, type OrderItemDocument } from "@/models/Order";

const CREATING_STALE_MS = 5 * 60 * 1000;

export type ConvertCartToOrderResult = {
  orderId: string;
  reused: boolean;
  checkoutToken: string;
};

/** Issue fresh checkout cookie material after cart-bound conversion auth. */
export async function grantCheckoutAccessForCartConversionOrder(params: {
  orderId: string;
  cartId: string;
  expectedDraftIdempotencyKey: string;
}): Promise<string> {
  const cartPrefix = `cart:${params.cartId}:`;
  if (!params.expectedDraftIdempotencyKey.startsWith(cartPrefix)) {
    throw new CartError("CART_UNAUTHORIZED", "Invalid conversion binding", 403);
  }

  const order = await Order.findOne({
    _id: params.orderId,
    draftIdempotencyKey: params.expectedDraftIdempotencyKey,
  }).lean();

  if (!order || !isConversionOrderReady(order)) {
    throw new OrderError("ORDER_PERSIST_FAILED", "Order not ready", 403);
  }

  const checkoutToken = generateCheckoutAccessToken();
  const checkoutAccessTokenHash = hashCheckoutAccessToken(checkoutToken);

  const updated = await Order.findOneAndUpdate(
    {
      _id: params.orderId,
      draftIdempotencyKey: params.expectedDraftIdempotencyKey,
    },
    { $set: { checkoutAccessTokenHash } },
  );

  if (!updated) {
    throw new OrderError("ORDER_PERSIST_FAILED", "Checkout access update failed", 500);
  }

  return checkoutToken;
}

async function successWithCheckoutAccess(params: {
  orderId: string;
  cartId: string;
  draftIdempotencyKey: string;
  reused: boolean;
}): Promise<ConvertCartToOrderResult> {
  const checkoutToken = await grantCheckoutAccessForCartConversionOrder({
    orderId: params.orderId,
    cartId: params.cartId,
    expectedDraftIdempotencyKey: params.draftIdempotencyKey,
  });
  return {
    orderId: params.orderId,
    reused: params.reused,
    checkoutToken,
  };
}

function isConversionOrderReady(order: {
  status: string;
  items?: OrderItemDocument[] | null;
}): boolean {
  return order.status === "draft" && (order.items?.length ?? 0) > 0;
}

async function reconcileCartConverted(params: {
  cartId: string;
  orderId: string;
  conversionIdempotencyKey: string;
}): Promise<void> {
  await Cart.findOneAndUpdate(
    {
      _id: params.cartId,
      status: { $in: ["active", "converted"] },
    },
    {
      $set: {
        status: "converted",
        convertedOrderId: params.orderId,
        conversionIdempotencyKey: params.conversionIdempotencyKey,
      },
    },
  );
}

async function resolveExistingConversionOrder(
  draftIdempotencyKey: string,
): Promise<{ orderId: string } | null> {
  const existing = await Order.findOne({ draftIdempotencyKey }).lean();
  if (!existing) {
    return null;
  }
  if (isConversionOrderReady(existing)) {
    return { orderId: existing._id.toString() };
  }
  if (existing.status === "creating") {
    const updatedAt =
      existing.updatedAt instanceof Date
        ? existing.updatedAt.getTime()
        : Date.now();
    if (Date.now() - updatedAt < CREATING_STALE_MS) {
      throw new OrderError("ORDER_IN_PROGRESS", "Order in progress", 409);
    }
    await Order.deleteOne({ _id: existing._id, status: "creating" });
    return null;
  }
  return null;
}

async function claimConversionOrder(
  draftIdempotencyKey: string,
): Promise<{ orderId: string; claimed: boolean }> {
  const resolved = await resolveExistingConversionOrder(draftIdempotencyKey);
  if (resolved) {
    return { orderId: resolved.orderId, claimed: false };
  }

  const orderId = new mongoose.Types.ObjectId();
  try {
    await Order.create({
      _id: orderId,
      status: "creating",
      draftIdempotencyKey,
      items: [],
    });
    return { orderId: orderId.toString(), claimed: true };
  } catch (err) {
    const isDuplicate =
      err instanceof Error &&
      "code" in err &&
      (err as { code?: number }).code === 11000;
    if (isDuplicate) {
      const again = await resolveExistingConversionOrder(draftIdempotencyKey);
      if (again) {
        return { orderId: again.orderId, claimed: false };
      }
      throw new OrderError("ORDER_IN_PROGRESS", "Order in progress", 409);
    }
    throw err;
  }
}

export async function convertCartToOrder(params: {
  cartId: string;
  conversionIdempotencyKey: string;
}): Promise<ConvertCartToOrderResult> {
  await connectDb();

  const cart = await Cart.findById(params.cartId).lean();
  if (!cart) {
    throw new CartError("CART_NOT_FOUND", "Cart not found", 404);
  }

  const draftIdempotencyKey = buildCartConversionDraftIdempotencyKey(
    params.cartId,
    params.conversionIdempotencyKey,
  );

  if (cart.status === "converted") {
    if (!cart.convertedOrderId) {
      throw new CartError("CART_NOT_ACTIVE", "Cart already converted", 409);
    }
    if (
      cart.conversionIdempotencyKey &&
      cart.conversionIdempotencyKey !== params.conversionIdempotencyKey
    ) {
      throw new CartError("CART_UNAUTHORIZED", "Conversion key mismatch", 403);
    }
    return successWithCheckoutAccess({
      orderId: cart.convertedOrderId,
      cartId: params.cartId,
      draftIdempotencyKey,
      reused: true,
    });
  }

  if (cart.status !== "active") {
    throw new CartError("CART_NOT_ACTIVE", "Cart not active", 409);
  }

  const items = cart.items ?? [];
  if (items.length === 0) {
    throw new CartError("CART_NOT_ACTIVE", "Empty cart", 400);
  }

  const earlyOrder = await resolveExistingConversionOrder(draftIdempotencyKey);
  if (earlyOrder) {
    await reconcileCartConverted({
      cartId: params.cartId,
      orderId: earlyOrder.orderId,
      conversionIdempotencyKey: params.conversionIdempotencyKey,
    });
    return successWithCheckoutAccess({
      orderId: earlyOrder.orderId,
      cartId: params.cartId,
      draftIdempotencyKey,
      reused: true,
    });
  }

  await validateCartItemsForConversion(items as CartLineForConversion[]);

  const claim = await claimConversionOrder(draftIdempotencyKey);
  const orderId = claim.orderId;

  if (!claim.claimed) {
    await reconcileCartConverted({
      cartId: params.cartId,
      orderId,
      conversionIdempotencyKey: params.conversionIdempotencyKey,
    });
    return successWithCheckoutAccess({
      orderId,
      cartId: params.cartId,
      draftIdempotencyKey,
      reused: true,
    });
  }

  const copiedOrderPaths: string[] = [];
  const orderItems: OrderItemDocument[] = [];

  try {
    for (const item of items) {
      const design = parseCartLineDesign(item.design);
      if (!design) {
        throw new OrderError("INVALID_DESIGN", "Invalid design", 400);
      }

      const copied = await copyCartItemAssetsToOrder({
        cartId: params.cartId,
        orderId,
        item: item as CartItemDocument,
      });
      copiedOrderPaths.push(...copied.copiedPathnames);

      orderItems.push({
        lineId: item.lineId,
        quantity: item.quantity,
        creationMode: item.creationMode,
        design,
        assets: {
          originalImage: copied.originalImage,
          finalArtwork: copied.finalArtwork,
        },
      });
    }

    const finalized = await Order.findOneAndUpdate(
      { _id: orderId, status: "creating" },
      {
        $set: {
          status: "draft",
          items: orderItems,
        },
      },
      { new: true },
    ).lean();

    if (!finalized) {
      throw new OrderError("ORDER_PERSIST_FAILED", "Finalize failed", 500);
    }

    const cartMarked = await Cart.findOneAndUpdate(
      { _id: params.cartId, status: "active" },
      {
        $set: {
          status: "converted",
          convertedOrderId: orderId,
          conversionIdempotencyKey: params.conversionIdempotencyKey,
        },
      },
      { new: true },
    ).lean();

    if (!cartMarked) {
      await reconcileCartConverted({
        cartId: params.cartId,
        orderId,
        conversionIdempotencyKey: params.conversionIdempotencyKey,
      });
    }

    return successWithCheckoutAccess({
      orderId,
      cartId: params.cartId,
      draftIdempotencyKey,
      reused: false,
    });
  } catch (err) {
    await deletePrivateBlobPaths(copiedOrderPaths);
    try {
      await Order.deleteOne({ _id: orderId, status: "creating" });
    } catch (deleteErr) {
      console.error("[cart/convert] order cleanup failed", { orderId, deleteErr });
    }

    if (err instanceof OrderError || err instanceof CartError) {
      throw err;
    }
    console.error("[cart/convert] failed", { cartId: params.cartId, orderId, err });
    throw new OrderError("ORDER_PERSIST_FAILED", "Conversion failed", 500);
  }
}
