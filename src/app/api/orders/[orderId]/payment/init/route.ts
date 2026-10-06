import { authorizeCheckoutAccess } from "@/lib/checkout/authorizeCheckoutAccess";
import { initiateOrderPayment } from "@/lib/orders/initiateOrderPayment";
import { OrderError, userMessageForOrderCode } from "@/lib/orders/errors";
import { parsePaymentInitBody } from "@/lib/orders/paymentInitSchema";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { orderId } = await context.params;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return paymentInitError("INVALID_DESIGN", 400, "יש לאשר את התקנון כדי להמשיך.");
    }

    if (!parsePaymentInitBody(body)) {
      return paymentInitError("INVALID_DESIGN", 400, "יש לאשר את התקנון כדי להמשיך.");
    }

    const { order } = await authorizeCheckoutAccess(orderId, request, {
      mode: "payment_init",
    });

    const result = await initiateOrderPayment({ orderId, order });

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
      return NextResponse.json(
        {
          ok: false,
          code: err.code,
          message: userMessageForOrderCode(err.code),
        },
        { status },
      );
    }

    return NextResponse.json({
      ok: true,
      paymentPageLink: result.paymentPageLink,
    });
  } catch (err) {
    if (err instanceof OrderError) {
      const status = err.httpStatus === 401 ? 401 : 404;
      return NextResponse.json(
        {
          ok: false,
          code: err.code,
          message: userMessageForOrderCode(err.code),
        },
        { status },
      );
    }
    console.error("[api/orders/payment/init POST]", err);
    return paymentInitError("ORDER_PERSIST_FAILED", 500);
  }
}

function paymentInitError(
  code: Parameters<typeof userMessageForOrderCode>[0],
  status: number,
  message?: string,
) {
  return NextResponse.json(
    {
      ok: false,
      code,
      message: message ?? userMessageForOrderCode(code),
    },
    { status },
  );
}
