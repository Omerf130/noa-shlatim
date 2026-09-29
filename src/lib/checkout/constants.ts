export const CHECKOUT_ACCESS_COOKIE = "checkout_access";

/** 30 days — draft checkout revisit */
export const CHECKOUT_ACCESS_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function checkoutAccessCookieValue(orderId: string, token: string): string {
  return `${orderId}.${token}`;
}

export function parseCheckoutAccessCookieValue(
  value: string,
): { orderId: string; token: string } | null {
  const dot = value.indexOf(".");
  if (dot <= 0 || dot >= value.length - 1) {
    return null;
  }
  return {
    orderId: value.slice(0, dot),
    token: value.slice(dot + 1),
  };
}

export function checkoutAccessCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
