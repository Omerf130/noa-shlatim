import type { CartStatus } from "@/models/Cart";

export const MAX_CART_ITEM_QUANTITY = 99;

export type CartSummaryStatus = "empty" | CartStatus;

export type CartSummaryDto = {
  ok: true;
  status: CartSummaryStatus;
  lineCount: number;
  totalQuantity: number;
};

export const EMPTY_CART_SUMMARY: CartSummaryDto = {
  ok: true,
  status: "empty",
  lineCount: 0,
  totalQuantity: 0,
};

/** Normalize quantity for summary totals — invalid values contribute 0. */
export function normalizedCartItemQuantity(quantity: unknown): number {
  if (typeof quantity !== "number" || !Number.isInteger(quantity)) {
    return 0;
  }
  if (quantity < 1) {
    return 0;
  }
  return Math.min(quantity, MAX_CART_ITEM_QUANTITY);
}

export function computeCartCounts(
  items: Array<{ quantity?: unknown }> | null | undefined,
): { lineCount: number; totalQuantity: number } {
  const list = items ?? [];
  let totalQuantity = 0;
  for (const item of list) {
    totalQuantity += normalizedCartItemQuantity(item.quantity);
  }
  return {
    lineCount: list.length,
    totalQuantity,
  };
}

export function buildCartSummaryDto(params: {
  status: CartStatus;
  items: Array<{ quantity?: unknown }> | null | undefined;
}): CartSummaryDto {
  const { lineCount, totalQuantity } = computeCartCounts(params.items);
  return {
    ok: true,
    status: params.status,
    lineCount,
    totalQuantity,
  };
}
