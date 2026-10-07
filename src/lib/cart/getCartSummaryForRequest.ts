import { authorizeCartFromCookie } from "@/lib/cart/authorizeCartAccess";
import {
  buildCartSummaryDto,
  EMPTY_CART_SUMMARY,
  type CartSummaryDto,
} from "@/lib/cart/cartSummary";

export async function getCartSummaryForRequest(
  request?: Request,
): Promise<CartSummaryDto> {
  const authorized = await authorizeCartFromCookie(request);
  if (!authorized) {
    return EMPTY_CART_SUMMARY;
  }

  return buildCartSummaryDto({
    status: authorized.cart.status,
    items: authorized.cart.items,
  });
}
