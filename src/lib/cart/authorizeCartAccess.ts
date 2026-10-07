import { connectDb } from "@/lib/db/connect";
import {
  CART_ACCESS_COOKIE,
  parseCartAccessCookieValue,
} from "@/lib/cart/constants";
import { verifyCartAccessToken } from "@/lib/cart/cartAccessToken";
import { isValidCartId } from "@/lib/cart/assertValidCartId";
import { Cart, type CartItemDocument, type CartStatus } from "@/models/Cart";
import { cookies } from "next/headers";

export type AuthorizedCart = {
  cartId: string;
  cart: {
    status: CartStatus;
    items: CartItemDocument[];
    convertedOrderId?: string | null;
  };
};

function tokenFromRequestQuery(cartId: string, request: Request): string | null {
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("access");
  if (queryToken?.trim()) {
    return queryToken.trim();
  }
  return null;
}

export async function extractCartAccessToken(
  cartId: string,
  request?: Request,
): Promise<string | null> {
  if (request) {
    const fromQuery = tokenFromRequestQuery(cartId, request);
    if (fromQuery) {
      return fromQuery;
    }
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(CART_ACCESS_COOKIE)?.value;
  if (!raw) {
    return null;
  }
  const parsed = parseCartAccessCookieValue(raw);
  if (!parsed || parsed.cartId !== cartId) {
    return null;
  }
  return parsed.token;
}

export function parseCartAccessFromCookieValue(
  raw: string | null | undefined,
): { cartId: string; token: string } | null {
  if (!raw?.trim()) {
    return null;
  }
  const parsed = parseCartAccessCookieValue(raw.trim());
  if (!parsed || !isValidCartId(parsed.cartId)) {
    return null;
  }
  return parsed;
}

async function loadCartIfAuthorized(
  cartId: string,
  accessToken: string,
): Promise<AuthorizedCart | null> {
  if (!isValidCartId(cartId) || !accessToken) {
    return null;
  }

  await connectDb();
  const doc = await Cart.findById(cartId).lean();
  if (!doc?.accessTokenHash) {
    return null;
  }

  if (!verifyCartAccessToken(accessToken, doc.accessTokenHash)) {
    return null;
  }

  const status = doc.status;
  if (status !== "active" && status !== "converted") {
    return null;
  }

  return {
    cartId,
    cart: {
      status,
      items: doc.items ?? [],
      convertedOrderId: doc.convertedOrderId ?? null,
    },
  };
}

/**
 * Authorize cart from explicit id + token (e.g. tests or future bootstrap).
 * Returns null on any failure — does not distinguish missing cart vs bad token.
 */
export async function authorizeCartAccess(params: {
  cartId: string;
  accessToken: string;
}): Promise<AuthorizedCart | null> {
  return loadCartIfAuthorized(params.cartId, params.accessToken);
}

/**
 * Resolve cart from HttpOnly cookie (and optional request query for same cart id).
 * Returns null when cookie missing, malformed, or token invalid.
 */
export async function authorizeCartFromCookie(
  request?: Request,
): Promise<AuthorizedCart | null> {
  const cookieStore = await cookies();
  const parsed = parseCartAccessFromCookieValue(
    cookieStore.get(CART_ACCESS_COOKIE)?.value,
  );
  if (!parsed) {
    return null;
  }

  if (request) {
    const queryToken = tokenFromRequestQuery(parsed.cartId, request);
    if (queryToken && queryToken !== parsed.token) {
      return loadCartIfAuthorized(parsed.cartId, queryToken);
    }
  }

  return loadCartIfAuthorized(parsed.cartId, parsed.token);
}
