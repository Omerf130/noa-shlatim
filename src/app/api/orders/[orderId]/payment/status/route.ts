import { authorizeCheckoutAccess } from "@/lib/checkout/authorizeCheckoutAccess";
import { buildCustomerPaymentStatusDto } from "@/lib/orders/customerPaymentStatusDto";
import { OrderError } from "@/lib/orders/errors";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { orderId } = await context.params;

  try {
    const auth = await authorizeCheckoutAccess(orderId, request, { mode: "view" });
    return NextResponse.json(buildCustomerPaymentStatusDto(auth));
  } catch (err) {
    if (err instanceof OrderError) {
      const status = err.httpStatus === 401 ? 401 : 404;
      return NextResponse.json({ ok: false }, { status });
    }
    console.error("[api/orders/payment/status GET]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
