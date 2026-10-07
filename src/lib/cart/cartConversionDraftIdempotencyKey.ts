import { isValidCartId } from "@/lib/cart/assertValidCartId";

export function buildCartConversionDraftIdempotencyKey(
  cartId: string,
  conversionIdempotencyKey: string,
): string {
  if (!isValidCartId(cartId)) {
    throw new Error("Invalid cart id");
  }
  const key = conversionIdempotencyKey.trim();
  if (!key) {
    throw new Error("Invalid conversion idempotency key");
  }
  return `cart:${cartId}:${key}`;
}
