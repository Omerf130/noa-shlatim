import {
  MAX_CART_LINE_QUANTITY,
  MIN_CART_LINE_QUANTITY,
} from "@/lib/cart/cartConstants";
import { CartError } from "@/lib/cart/cartErrors";

export function parseCartLineQuantity(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isInteger(raw)) {
    throw new CartError("INVALID_QUANTITY", "Invalid quantity", 400);
  }
  if (raw < MIN_CART_LINE_QUANTITY || raw > MAX_CART_LINE_QUANTITY) {
    throw new CartError("INVALID_QUANTITY", "Out of bounds", 400);
  }
  return raw;
}
