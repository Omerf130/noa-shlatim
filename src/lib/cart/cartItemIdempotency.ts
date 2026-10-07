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

/** Mongo filter: active cart that does not yet contain this add idempotency key. */
export function cartPushItemFilter(
  cartId: string,
  addIdempotencyKey: string,
): Record<string, unknown> {
  return {
    _id: cartId,
    status: "active",
    items: { $not: { $elemMatch: { addIdempotencyKey } } },
  };
}
