import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function generateCheckoutAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashCheckoutAccessToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function verifyCheckoutAccessToken(
  token: string,
  storedHash: string | null | undefined,
): boolean {
  if (!storedHash || !token) {
    return false;
  }
  const computed = hashCheckoutAccessToken(token);
  try {
    const a = Buffer.from(computed, "hex");
    const b = Buffer.from(storedHash, "hex");
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
