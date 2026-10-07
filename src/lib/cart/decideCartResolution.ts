import type { AuthorizedCart } from "@/lib/cart/authorizeCartAccess";

export type CartResolutionDecision =
  | { action: "reuse"; cartId: string }
  | { action: "create" };

/**
 * CASE 1: valid active cookie → reuse cart.
 * CASE 2: missing/invalid cookie → create.
 * CASE 3: converted cart → create (do not mutate converted).
 */
export function decideCartResolution(
  authorized: AuthorizedCart | null,
): CartResolutionDecision {
  if (authorized && authorized.cart.status === "active") {
    return { action: "reuse", cartId: authorized.cartId };
  }
  return { action: "create" };
}
