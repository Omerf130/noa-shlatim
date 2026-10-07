import { authorizeCartFromCookie } from "@/lib/cart/authorizeCartAccess";
import { createCartWithAccess } from "@/lib/cart/createCartWithAccess";
import { decideCartResolution } from "@/lib/cart/decideCartResolution";

export type ResolvedActiveCartForAdd = {
  cartId: string;
  /** Set when a new cart was created — attach to HttpOnly cart_access cookie. */
  setCookie?: {
    value: string;
    maxAge: number;
  };
};

export async function resolveActiveCartForAdd(
  request?: Request,
): Promise<ResolvedActiveCartForAdd> {
  const authorized = await authorizeCartFromCookie(request);
  const decision = decideCartResolution(authorized);

  if (decision.action === "reuse") {
    return { cartId: decision.cartId };
  }

  const created = await createCartWithAccess();
  return {
    cartId: created.cartId,
    setCookie: {
      value: created.cookieValue,
      maxAge: created.cookieMaxAgeSeconds,
    },
  };
}
