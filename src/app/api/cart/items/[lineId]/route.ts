import {
  authorizeActiveCartMutation,
  findAuthorizedCartLine,
} from "@/lib/cart/authorizeActiveCartMutation";
import { handleCartRouteError } from "@/lib/cart/cartApiResponse";
import { CartError } from "@/lib/cart/cartErrors";
import { getCartDetailForRequest } from "@/lib/cart/getCartDetailForRequest";
import { removeCartLine } from "@/lib/cart/removeCartLine";
import { updateCartLineQuantity } from "@/lib/cart/updateCartLineQuantity";
import { parseCartLineQuantity } from "@/lib/cart/validateCartLineQuantity";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ lineId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { lineId } = await context.params;
    const authorized = await authorizeActiveCartMutation(request);
    if (!findAuthorizedCartLine(authorized, lineId)) {
      throw new CartError("CART_LINE_NOT_FOUND", "Not found", 404);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new CartError("INVALID_QUANTITY", "Bad body", 400);
    }

    const quantity = parseCartLineQuantity(
      body && typeof body === "object" && "quantity" in body
        ? (body as { quantity: unknown }).quantity
        : undefined,
    );

    await updateCartLineQuantity({
      cartId: authorized.cartId,
      lineId,
      quantity,
    });

    const detail = await getCartDetailForRequest(request);
    return NextResponse.json(detail);
  } catch (err) {
    return handleCartRouteError(err);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { lineId } = await context.params;
    const authorized = await authorizeActiveCartMutation(request);
    if (!findAuthorizedCartLine(authorized, lineId)) {
      throw new CartError("CART_LINE_NOT_FOUND", "Not found", 404);
    }

    await removeCartLine({ cartId: authorized.cartId, lineId });
    const detail = await getCartDetailForRequest(request);
    return NextResponse.json(detail);
  } catch (err) {
    return handleCartRouteError(err);
  }
}
