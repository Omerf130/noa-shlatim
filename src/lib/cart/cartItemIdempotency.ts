export type CartItemIdempotencyRow = {
  lineId: string;
  addIdempotencyKey: string;
  quantity?: number;
};

export function findCartItemByAddIdempotencyKey(
  items: CartItemIdempotencyRow[] | undefined | null,
  addIdempotencyKey: string,
): CartItemIdempotencyRow | undefined {
  if (!items?.length) {
    return undefined;
  }
  return items.find((item) => item.addIdempotencyKey === addIdempotencyKey);
}

/**
 * Mongo filter: active cart that does not yet contain this add idempotency key.
 * Explicit $or covers missing/empty `items` (first anonymous add after Cart.create)
 * and carts that already have lines with other keys.
 */
export function cartPushItemFilter(
  cartId: string,
  addIdempotencyKey: string,
): Record<string, unknown> {
  return {
    _id: cartId,
    status: "active",
    $or: [
      { items: { $exists: false } },
      { items: { $size: 0 } },
      { items: { $not: { $elemMatch: { addIdempotencyKey } } } },
    ],
  };
}
