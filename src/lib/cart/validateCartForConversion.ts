import { parseCartLineDesign } from "@/lib/cart/parseCartLineDesign";
import { OrderError } from "@/lib/orders/errors";
import { validateDesignForPurchase } from "@/lib/orders/validateDesignForPurchase";
import { isValidOrderItemQuantity } from "@/lib/orders/validateOrderItemQuantity";
import type { CartItemDocument } from "@/models/Cart";

export type CartLineForConversion = Pick<
  CartItemDocument,
  "lineId" | "quantity" | "creationMode" | "design" | "assets"
>;

export async function validateCartItemsForConversion(
  items: CartLineForConversion[],
): Promise<void> {
  if (!items.length) {
    throw new OrderError("INVALID_DESIGN", "Empty cart", 400);
  }

  for (const item of items) {
    if (!isValidOrderItemQuantity(item.quantity)) {
      throw new OrderError("INVALID_DESIGN", "Invalid quantity", 400);
    }

    const design = parseCartLineDesign(item.design);
    if (!design) {
      throw new OrderError("INVALID_DESIGN", "Invalid design", 400);
    }

    if (item.creationMode !== design.creationMode) {
      throw new OrderError("INVALID_DESIGN", "Invalid design", 400);
    }

    const original = item.assets?.originalImage?.pathname;
    const artwork = item.assets?.finalArtwork?.pathname;
    if (!original || !artwork) {
      throw new OrderError("INVALID_ASSET", "Missing assets", 400);
    }

    await validateDesignForPurchase(design);
  }
}
