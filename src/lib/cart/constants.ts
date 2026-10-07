export const CART_ACCESS_COOKIE = "cart_access";

/** 30 days — anonymous cart revisit */
export const CART_ACCESS_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function cartAccessCookieValue(cartId: string, token: string): string {
  return `${cartId}.${token}`;
}

export function parseCartAccessCookieValue(
  value: string,
): { cartId: string; token: string } | null {
  const dot = value.indexOf(".");
  if (dot <= 0 || dot >= value.length - 1) {
    return null;
  }
  return {
    cartId: value.slice(0, dot),
    token: value.slice(dot + 1),
  };
}

export function cartAccessCookieOptions(maxAge: number = CART_ACCESS_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
