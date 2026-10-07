import { parseCartLineDesign } from "@/lib/cart/parseCartLineDesign";
import { OrderError } from "@/lib/orders/errors";
import type { ResolvedOrderItem } from "@/lib/orders/resolveOrderItems";
import { validateDesignForPurchase } from "@/lib/orders/validateDesignForPurchase";
import { isValidOrderItemQuantity } from "@/lib/orders/validateOrderItemQuantity";

export async function validateResolvedOrderItemsForPayment(
  items: ResolvedOrderItem[],
): Promise<void> {
  if (!items.length) {
    throw new OrderError("INVALID_DESIGN", "Invalid order", 400);
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

    if (!item.assets.finalArtwork?.pathname) {
      throw new OrderError("INVALID_ASSET", "Missing assets", 400);
    }

    await validateDesignForPurchase(design);
  }
}
