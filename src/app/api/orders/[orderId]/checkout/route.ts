import { authorizeCheckoutAccess } from "@/lib/checkout/authorizeCheckoutAccess";
import {
  checkoutCustomerSchema,
  formatCheckoutValidationError,
} from "@/lib/checkout/customerSchema";
import { buildCheckoutSaveResponseDto } from "@/lib/checkout/checkoutPageDto";
import { connectDb } from "@/lib/db/connect";
import { OrderError, userMessageForOrderCode } from "@/lib/orders/errors";
import { Order } from "@/models/Order";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { orderId } = await context.params;

  try {
    await authorizeCheckoutAccess(orderId, request);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return checkoutJsonError("INVALID_DESIGN", 400);
    }

    const parsed = checkoutCustomerSchema.safeParse(body);
    if (!parsed.success) {
      const message = formatCheckoutValidationError(parsed.error.issues[0]!);
      return NextResponse.json(
        { ok: false, code: "INVALID_DESIGN", message },
        { status: 400 },
      );
    }

    await connectDb();
    const updated = await Order.findOneAndUpdate(
      {
        _id: orderId,
        status: "draft",
        creationMode: "photo",
      },
      {
        $set: {
          customer: parsed.data.customer,
          notes: parsed.data.notes,
        },
      },
      { new: true },
    ).lean();

    if (!updated) {
      return checkoutJsonError("ORDER_PERSIST_FAILED", 404);
    }

    return NextResponse.json(buildCheckoutSaveResponseDto(updated));
  } catch (err) {
    if (err instanceof OrderError) {
      const status = err.httpStatus === 401 ? 401 : err.httpStatus;
      return NextResponse.json(
        {
          ok: false,
          code: err.code,
          message: userMessageForOrderCode(err.code),
        },
        { status },
      );
    }
    console.error("[api/orders/checkout PATCH]", err);
    return checkoutJsonError("ORDER_PERSIST_FAILED", 500);
  }
}

function checkoutJsonError(
  code: Parameters<typeof userMessageForOrderCode>[0],
  status: number,
) {
  return NextResponse.json(
    {
      ok: false,
      code,
      message: userMessageForOrderCode(code),
    },
    { status },
  );
}
