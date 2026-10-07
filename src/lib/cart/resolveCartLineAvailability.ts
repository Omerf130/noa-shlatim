import {
  isBackgroundEnabledForNewOrder,
  loadBackgroundLeanById,
} from "@/lib/backgrounds/loadBackgrounds";
import type { OrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";
import { OrderError } from "@/lib/orders/errors";
import { userMessageForOrderCode } from "@/lib/orders/errors";
import { validateDesignProductAvailability } from "@/lib/orders/validateDesignForPurchase";
import type { StoreMaterialPricingLike } from "@/lib/store/materialAvailability";

export type CartLineAvailabilityResult =
  | { availability: "available" }
  | { availability: "unavailable"; unavailableReason: string };

const GENERIC_UNAVAILABLE =
  "האפשרות שבחרתם כבר אינה זמינה. הסירו את הפריט מהסל וצרו שלט חדש.";

function reasonFromOrderError(err: OrderError): string {
  return userMessageForOrderCode(err.code);
}

export async function resolveCartLineAvailability(params: {
  design: OrderDesignSnapshot;
  pricingInput: StoreMaterialPricingLike;
}): Promise<CartLineAvailabilityResult> {
  try {
    validateDesignProductAvailability(params.design, params.pricingInput);
  } catch (err) {
    if (err instanceof OrderError) {
      return {
        availability: "unavailable",
        unavailableReason: reasonFromOrderError(err),
      };
    }
    return { availability: "unavailable", unavailableReason: GENERIC_UNAVAILABLE };
  }

  const bgRow = await loadBackgroundLeanById(params.design.backgroundId);
  if (!isBackgroundEnabledForNewOrder(bgRow)) {
    return {
      availability: "unavailable",
      unavailableReason: userMessageForOrderCode("BACKGROUND_UNAVAILABLE"),
    };
  }

  return { availability: "available" };
}
