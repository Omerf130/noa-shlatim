const CART_ID_HEX = /^[a-f0-9]{24}$/i;

export function assertValidCartId(cartId: string): void {
  if (!CART_ID_HEX.test(cartId)) {
    throw new Error("Invalid cart id");
  }
}

export function isValidCartId(cartId: string): boolean {
  return CART_ID_HEX.test(cartId);
}
