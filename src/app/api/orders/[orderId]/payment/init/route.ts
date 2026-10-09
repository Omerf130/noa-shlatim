import { authorizeCheckoutAccess } from "@/lib/checkout/authorizeCheckoutAccess";
import { beginOperationTrace } from "@/lib/diagnostics/operationTrace";
import { initiateOrderPayment } from "@/lib/orders/initiateOrderPayment";
import { OrderError, userMessageForOrderCode } from "@/lib/orders/errors";
import { parsePaymentInitBody } from "@/lib/orders/paymentInitSchema";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const trace = beginOperationTrace("payment_init");
  const { orderId } = await context.params;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return trace.failJson({
        stage: "parse_body",
        code: "INVALID_DESIGN",
        status: 400,
        message: "יש לאשר את התקנון כדי להמשיך.",
      });
    }

    if (!parsePaymentInitBody(body)) {
      return trace.failJson({
        stage: "validate",
        code: "INVALID_DESIGN",
        status: 400,
        message: "יש לאשר את התקנון כדי להמשיך.",
      });
    }

    const auth = await authorizeCheckoutAccess(orderId, request, {
      mode: "payment_init",
    });

    const initBody = parsePaymentInitBody(body)!;

    const result = await initiateOrderPayment({
      orderId,
      acknowledgedTotalAmountMinor: initBody.acknowledgedTotalAmountMinor ?? null,
      order: {
        status: auth.order.status,
        design: auth.order.design,
        creationMode: auth.order.creationMode,
        assets: auth.order.assets,
        items: auth.checkoutSource.items,
        customer: auth.order.customer,
        shippingAddress: auth.order.shippingAddress,
        checkoutSelection: auth.order.checkoutSelection,
        commercialSnapshot: auth.order.commercialSnapshot,
        termsAcceptance: auth.order.termsAcceptance,
        payment: auth.order.payment,
      },
    });

    if (!result.ok) {
      const err = result.error;
      const status =
        err.httpStatus === 401
          ? 401
          : err.httpStatus === 409
            ? 409
            : err.httpStatus === 400
              ? 400
              : err.httpStatus === 503
                ? 503
                : err.httpStatus === 502 || err.code === "PAYPLUS_LINK_FAILED"
                  ? 502
                  : 404;
      return trace.failJson({
        stage: err.code === "PAYPLUS_LINK_FAILED" ? "provider" : "persist",
        code: err.code,
        status,
        message: userMessageForOrderCode(err.code),
      });
    }

    return trace.okJson({
      ok: true,
      paymentPageLink: result.paymentPageLink,
    });
  } catch (err) {
    if (err instanceof OrderError) {
      const status = err.httpStatus === 401 ? 401 : 404;
      return trace.failJson({
        stage: "auth",
        code: err.code,
        status,
        message: userMessageForOrderCode(err.code),
      });
    }
    console.error("[api/orders/payment/init POST]", trace.traceId, err);
    return trace.failJson({
      stage: "unknown",
      code: "ORDER_PERSIST_FAILED",
      status: 500,
      message: userMessageForOrderCode("ORDER_PERSIST_FAILED"),
    });
  }
}
