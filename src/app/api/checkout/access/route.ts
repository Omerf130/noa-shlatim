import {
  CHECKOUT_ACCESS_COOKIE,
  CHECKOUT_ACCESS_MAX_AGE_SECONDS,
  checkoutAccessCookieOptions,
  checkoutAccessCookieValue,
} from "@/lib/checkout/constants";
import { verifyCheckoutAccessBootstrap } from "@/lib/checkout/authorizeCheckoutAccess";
import { assertValidOrderId } from "@/lib/orders/orderBlobPaths";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");
  const accessRaw = url.searchParams.get("access");

  if (!orderId || !accessRaw?.trim()) {
    return new NextResponse(null, { status: 404 });
  }

  const accessToken = accessRaw.trim();

  try {
    assertValidOrderId(orderId);
  } catch {
    return new NextResponse(null, { status: 404 });
  }

  const ok = await verifyCheckoutAccessBootstrap(orderId, accessToken);
  if (!ok) {
    return new NextResponse(null, { status: 404 });
  }

  const redirectUrl = new URL(`/checkout/${orderId}`, request.url);
  const response = NextResponse.redirect(redirectUrl, 307);

  response.cookies.set(
    CHECKOUT_ACCESS_COOKIE,
    checkoutAccessCookieValue(orderId, accessToken),
    checkoutAccessCookieOptions(CHECKOUT_ACCESS_MAX_AGE_SECONDS),
  );

  return response;
}
