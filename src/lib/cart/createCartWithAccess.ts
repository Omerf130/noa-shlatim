import { connectDb } from "@/lib/db/connect";
import {
  cartAccessCookieValue,
  CART_ACCESS_MAX_AGE_SECONDS,
} from "@/lib/cart/constants";
import {
  generateCartAccessToken,
  hashCartAccessToken,
} from "@/lib/cart/cartAccessToken";
import { Cart } from "@/models/Cart";

export type CreateCartWithAccessResult = {
  cartId: string;
  /** Raw token — set HttpOnly cookie only; never persist or expose in API JSON. */
  accessToken: string;
  cookieValue: string;
  cookieMaxAgeSeconds: number;
};

/**
 * Create a new active Cart with access credentials (for C1 add-to-cart).
 * C0 does not call this from public routes.
 */
export async function createCartWithAccess(): Promise<CreateCartWithAccessResult> {
  await connectDb();

  const accessToken = generateCartAccessToken();
  const accessTokenHash = hashCartAccessToken(accessToken);

  const doc = await Cart.create({
    accessTokenHash,
    status: "active",
    items: [],
  });

  const cartId = doc._id.toString();

  return {
    cartId,
    accessToken,
    cookieValue: cartAccessCookieValue(cartId, accessToken),
    cookieMaxAgeSeconds: CART_ACCESS_MAX_AGE_SECONDS,
  };
}
