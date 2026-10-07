import { authorizeCartFromCookie, type AuthorizedCart } from "@/lib/cart/authorizeCartAccess";
import { CartError } from "@/lib/cart/cartErrors";

export async function authorizeActiveCartMutation(
  request: Request,
): Promise<AuthorizedCart> {
  const authorized = await authorizeCartFromCookie(request);
  if (!authorized) {
    throw new CartError("CART_UNAUTHORIZED", "Unauthorized", 401);
  }
  if (authorized.cart.status !== "active") {
    throw new CartError("CART_NOT_ACTIVE", "Cart not active", 409);
  }
  return authorized;
}

export function findAuthorizedCartLine(
  authorized: AuthorizedCart,
  lineId: string,
) {
  return authorized.cart.items?.find((item) => item.lineId === lineId) ?? null;
}
