import {
  authorizeCartFromCookie,
  type AuthorizedCart,
} from "@/lib/cart/authorizeCartAccess";
import { CartError } from "@/lib/cart/cartErrors";
import type { CartItemDocument } from "@/models/Cart";

export type AuthorizedCartLineArtwork = {
  authorized: AuthorizedCart;
  line: CartItemDocument;
  artworkPathname: string;
};

export async function authorizeCartLineArtwork(
  request: Request,
  lineId: string,
): Promise<AuthorizedCartLineArtwork> {
  const authorized = await authorizeCartFromCookie(request);
  if (!authorized) {
    throw new CartError("CART_UNAUTHORIZED", "Unauthorized", 401);
  }

  const line = authorized.cart.items?.find((item) => item.lineId === lineId);
  if (!line) {
    throw new CartError("CART_LINE_NOT_FOUND", "Line not found", 404);
  }

  const pathname = line.assets?.finalArtwork?.pathname;
  if (!pathname) {
    throw new CartError("CART_LINE_NOT_FOUND", "Artwork missing", 404);
  }

  return {
    authorized,
    line: line as CartItemDocument,
    artworkPathname: pathname,
  };
}
