import {
  MAX_ORDER_ITEM_QUANTITY,
  MIN_ORDER_ITEM_QUANTITY,
} from "@/lib/orders/orderItemConstants";

export function isValidOrderItemQuantity(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= MIN_ORDER_ITEM_QUANTITY &&
    value <= MAX_ORDER_ITEM_QUANTITY
  );
}

export function assertValidOrderItemQuantity(value: unknown): number {
  if (!isValidOrderItemQuantity(value)) {
    throw new Error("Invalid order item quantity");
  }
  return value;
}
