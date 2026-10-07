import { authorizeCartConversion } from "@/lib/cart/authorizeActiveCartMutation";
import { handleCartRouteError } from "@/lib/cart/cartApiResponse";
import { convertCartToOrder } from "@/lib/cart/convertCartToOrder";
import { CartError } from "@/lib/cart/cartErrors";
import {
  CHECKOUT_ACCESS_COOKIE,
  CHECKOUT_ACCESS_MAX_AGE_SECONDS,
  checkoutAccessCookieOptions,
  checkoutAccessCookieValue,
} from "@/lib/checkout/constants";
import { OrderError, userMessageForOrderCode } from "@/lib/orders/errors";
import { draftIdempotencyKeySchema } from "@/lib/orders/orderDesignSchema";
import { assertValidOrderId } from "@/lib/orders/orderBlobPaths";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const conversionIdempotencyKeySchema = draftIdempotencyKeySchema;

export async function POST(request: Request) {
  try {
    const authorized = await authorizeCartConversion(request);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new CartError("CART_UNAUTHORIZED", "Invalid body", 400);
    }

    const parsed = conversionIdempotencyKeySchema.safeParse(
      body && typeof body === "object" && "conversionIdempotencyKey" in body
        ? (body as { conversionIdempotencyKey: unknown }).conversionIdempotencyKey
        : undefined,
    );
    if (!parsed.success) {
      throw new CartError("CART_UNAUTHORIZED", "Invalid idempotency key", 400);
    }

    const result = await convertCartToOrder({
      cartId: authorized.cartId,
      conversionIdempotencyKey: parsed.data,
    });

    try {
      assertValidOrderId(result.orderId);
    } catch {
      throw new OrderError("ORDER_PERSIST_FAILED", "Invalid order id", 500);
    }

    const response = NextResponse.json({
      ok: true,
      orderId: result.orderId,
      checkoutPath: `/checkout/${result.orderId}`,
      ...(result.reused ? { reused: true } : {}),
    });

    response.cookies.set(
      CHECKOUT_ACCESS_COOKIE,
      checkoutAccessCookieValue(result.orderId, result.checkoutToken),
      checkoutAccessCookieOptions(CHECKOUT_ACCESS_MAX_AGE_SECONDS),
    );

    return response;
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json(
        {
          ok: false,
          code: err.code,
          message: userMessageForOrderCode(err.code),
        },
        { status: err.httpStatus },
      );
    }
    return handleCartRouteError(err);
  }
}
