import { authorizeCartConversion } from "@/lib/cart/authorizeActiveCartMutation";
import { CartError, userMessageForCartCode } from "@/lib/cart/cartErrors";
import { convertCartToOrder } from "@/lib/cart/convertCartToOrder";
import {
  CHECKOUT_ACCESS_COOKIE,
  CHECKOUT_ACCESS_MAX_AGE_SECONDS,
  checkoutAccessCookieOptions,
  checkoutAccessCookieValue,
} from "@/lib/checkout/constants";
import { beginOperationTrace } from "@/lib/diagnostics/operationTrace";
import { OrderError, userMessageForOrderCode } from "@/lib/orders/errors";
import { draftIdempotencyKeySchema } from "@/lib/orders/orderDesignSchema";
import { assertValidOrderId } from "@/lib/orders/orderBlobPaths";

export const runtime = "nodejs";

const conversionIdempotencyKeySchema = draftIdempotencyKeySchema;

export async function POST(request: Request) {
  const trace = beginOperationTrace("cart_convert");

  try {
    let authorized;
    try {
      authorized = await authorizeCartConversion(request);
    } catch (err) {
      if (err instanceof CartError) {
        return trace.failJson({
          stage: "auth",
          code: err.code,
          status: err.httpStatus,
          message: userMessageForCartCode(err.code),
        });
      }
      throw err;
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return trace.failJson({
        stage: "parse_body",
        code: "CART_UNAUTHORIZED",
        status: 400,
        message: userMessageForCartCode("CART_UNAUTHORIZED"),
      });
    }

    const parsed = conversionIdempotencyKeySchema.safeParse(
      body && typeof body === "object" && "conversionIdempotencyKey" in body
        ? (body as { conversionIdempotencyKey: unknown }).conversionIdempotencyKey
        : undefined,
    );
    if (!parsed.success) {
      return trace.failJson({
        stage: "validate",
        code: "CART_UNAUTHORIZED",
        status: 400,
        message: userMessageForCartCode("CART_UNAUTHORIZED"),
      });
    }

    const result = await convertCartToOrder({
      cartId: authorized.cartId,
      conversionIdempotencyKey: parsed.data,
    });

    try {
      assertValidOrderId(result.orderId);
    } catch {
      return trace.failJson({
        stage: "persist",
        code: "ORDER_PERSIST_FAILED",
        status: 500,
        message: userMessageForOrderCode("ORDER_PERSIST_FAILED"),
      });
    }

    const response = trace.okJson({
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
      const stage =
        err.code === "ORDER_IN_PROGRESS"
          ? "persist"
          : err.code === "STORAGE_FAILED"
            ? "storage"
            : "persist";
      return trace.failJson({
        stage,
        code: err.code,
        status: err.httpStatus,
        message: userMessageForOrderCode(err.code),
      });
    }
    if (err instanceof CartError) {
      return trace.failJson({
        stage: "auth",
        code: err.code,
        status: err.httpStatus,
        message: userMessageForCartCode(err.code),
      });
    }
    console.error("[api/cart/convert]", trace.traceId, err);
    return trace.failJson({
      stage: "unknown",
      code: "ORDER_PERSIST_FAILED",
      status: 500,
      message: userMessageForOrderCode("ORDER_PERSIST_FAILED"),
    });
  }
}
