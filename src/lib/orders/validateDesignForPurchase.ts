import {
  assertBackgroundEnabledForNewOrder,
  BackgroundNotAvailableError,
} from "@/lib/backgrounds/loadBackgrounds";
import { OrderError } from "@/lib/orders/errors";
import type { OrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";
import {
  assertMagnetSizeForNewOrder,
  assertMaterialEnabledForNewOrder,
  MaterialNotAvailableError,
  type StoreMaterialPricingLike,
} from "@/lib/store/materialAvailability";
import { MagnetSizeNotAvailableError } from "@/lib/store/magnetSizes";
import { loadStoreSettingsDocument } from "@/lib/store/loadStoreSettings";

export type ValidateDesignForPurchaseOptions = {
  /** When omitted, loads current store settings from the database. */
  pricingInput?: StoreMaterialPricingLike;
  /** Defaults to DB-backed background check (production). */
  assertBackgroundEnabled?: (backgroundId: string) => Promise<void>;
};

async function resolvePricingInput(
  pricingInput?: StoreMaterialPricingLike,
): Promise<StoreMaterialPricingLike | undefined> {
  if (pricingInput !== undefined) {
    return pricingInput;
  }
  const settings = await loadStoreSettingsDocument();
  return settings
    ? { ...settings.pricing, magnetSizes: settings.magnetSizes }
    : undefined;
}

/**
 * Material / magnet rules shared by draft orders and cart lines (no I/O).
 */
export function validateDesignProductAvailability(
  design: OrderDesignSnapshot,
  pricingInput: StoreMaterialPricingLike | undefined,
): void {
  try {
    assertMaterialEnabledForNewOrder(design.material, pricingInput);
  } catch (err) {
    if (err instanceof MaterialNotAvailableError) {
      throw new OrderError("MATERIAL_UNAVAILABLE", "Material unavailable", 400);
    }
    throw err;
  }

  if (design.material === "wood" && design.magnetSizeId) {
    throw new OrderError("INVALID_DESIGN", "Invalid design", 400);
  }

  if (design.material === "magnet") {
    if (!design.magnetSizeId?.trim()) {
      throw new OrderError("INVALID_DESIGN", "Invalid design", 400);
    }
    try {
      assertMagnetSizeForNewOrder(design.magnetSizeId, pricingInput);
    } catch (err) {
      if (err instanceof MagnetSizeNotAvailableError) {
        throw new OrderError("MAGNET_SIZE_UNAVAILABLE", "Magnet size unavailable", 400);
      }
      throw err;
    }
  }
}

/**
 * Shared purchase validation for draft orders and cart line items.
 * Does not validate prices from the client — only catalog availability.
 */
export async function validateDesignForPurchase(
  design: OrderDesignSnapshot,
  options?: ValidateDesignForPurchaseOptions,
): Promise<void> {
  const pricingInput = await resolvePricingInput(options?.pricingInput);
  validateDesignProductAvailability(design, pricingInput);

  const assertBackground =
    options?.assertBackgroundEnabled ?? assertBackgroundEnabledForNewOrder;

  try {
    await assertBackground(design.backgroundId);
  } catch (err) {
    if (err instanceof BackgroundNotAvailableError) {
      throw new OrderError("BACKGROUND_UNAVAILABLE", "Background unavailable", 400);
    }
    throw err;
  }
}
