import { authorizeCheckoutAccess } from "@/lib/checkout/authorizeCheckoutAccess";
import { buildCheckoutCommercialForOrder } from "@/lib/checkout/buildCheckoutPageFromOrder";
import {
  buildCommercialSummaryForDeferredSelection,
  buildCommercialSummaryForSelection,
  resolveSelectedShippingMethod,
} from "@/lib/checkout/buildCheckoutCommercialView";
import {
  buildCheckoutSaveResponseDto,
} from "@/lib/checkout/checkoutPageDto";
import {
  formatCheckoutPatchError,
  parseCheckoutPatchBody,
} from "@/lib/checkout/checkoutPatchSchema";
import {
  CHECKOUT_COMMERCIAL_UNAVAILABLE_MESSAGE,
  CHECKOUT_STALE_SHIPPING_MESSAGE,
} from "@/lib/checkout/formatCheckoutUnavailableMessage";
import { resolveStoreConfigurationForCheckout } from "@/lib/store/resolveStoreConfigurationForCheckout";
import { connectDb } from "@/lib/db/connect";
import { OrderError, userMessageForOrderCode } from "@/lib/orders/errors";
import { resolveOrderItems } from "@/lib/orders/resolveOrderItems";
import { Order } from "@/models/Order";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { orderId } = await context.params;

  try {
    const auth = await authorizeCheckoutAccess(orderId, request);
    const lines = resolveOrderItems(auth.checkoutSource);
    if (lines.length === 0) {
      return checkoutJsonError("INVALID_DESIGN", 400, "נתונים לא תקינים.");
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return checkoutJsonError("INVALID_DESIGN", 400, "נתונים לא תקינים.");
    }

    const parsed = parseCheckoutPatchBody(body);
    if (!parsed) {
      return checkoutJsonError(
        "INVALID_DESIGN",
        400,
        formatCheckoutPatchError(body),
      );
    }

    const storeConfig = await resolveStoreConfigurationForCheckout();
    if (!storeConfig.ok) {
      return checkoutJsonError(
        "INVALID_DESIGN",
        400,
        CHECKOUT_COMMERCIAL_UNAVAILABLE_MESSAGE,
      );
    }

    const method = storeConfig.shippingMethods.find(
      (m) => m.methodId === parsed.selectedShippingMethodId,
    );
    if (!method) {
      return checkoutJsonError("INVALID_DESIGN", 400, CHECKOUT_STALE_SHIPPING_MESSAGE);
    }

    await connectDb();
    const updated = await Order.findOneAndUpdate(
      {
        _id: orderId,
        status: "draft",
      },
      {
        $set: {
          customer: parsed.customer,
          notes: parsed.notes,
          checkoutSelection: {
            shippingMethodId: parsed.selectedShippingMethodId,
          },
        },
      },
      { new: true },
    ).lean();

    if (!updated) {
      return checkoutJsonError("ORDER_PERSIST_FAILED", 404);
    }

    const commercial = await buildCheckoutCommercialForOrder({
      order: auth.checkoutSource,
      savedShippingMethodId: parsed.selectedShippingMethodId,
    });

    if (!commercial.available) {
      return checkoutJsonError(
        "ORDER_PERSIST_FAILED",
        500,
        CHECKOUT_COMMERCIAL_UNAVAILABLE_MESSAGE,
      );
    }

    const selected = resolveSelectedShippingMethod(
      commercial,
      parsed.selectedShippingMethodId,
    );
    if (!selected) {
      return checkoutJsonError("INVALID_DESIGN", 400, CHECKOUT_STALE_SHIPPING_MESSAGE);
    }

    const commercialWithSummary =
      commercial.pricingMode === "deferred"
        ? {
            ...commercial,
            selectedShippingMethodId: parsed.selectedShippingMethodId,
            selectionValid: true,
            staleSelectionMessage: null,
            summary: buildCommercialSummaryForDeferredSelection(
              commercial,
              selected,
            ),
          }
        : {
            ...commercial,
            selectedShippingMethodId: parsed.selectedShippingMethodId,
            selectionValid: true,
            staleSelectionMessage: null,
            summary: buildCommercialSummaryForSelection(commercial, selected),
          };

    return NextResponse.json(
      buildCheckoutSaveResponseDto({
        customer: {
          fullName: parsed.customer.fullName,
          phone: parsed.customer.phone,
          email: parsed.customer.email,
        },
        notes: parsed.notes,
        selectedShippingMethodId: parsed.selectedShippingMethodId,
        commercial: commercialWithSummary,
      }),
    );
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
