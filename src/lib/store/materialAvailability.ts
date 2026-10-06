import type { Material } from "@/types/signDesign";

export type StoreMaterialPricingLike = {
  woodPriceMinor?: number | null;
  magnetPriceMinor?: number | null;
  woodEnabled?: boolean | null;
  magnetEnabled?: boolean | null;
};

export type MaterialAvailability = {
  woodEnabled: boolean;
  magnetEnabled: boolean;
};

/** Missing fields default to enabled (backward compatible). */
export function normalizeMaterialAvailability(
  pricing: StoreMaterialPricingLike | undefined | null,
): MaterialAvailability {
  return {
    woodEnabled: pricing?.woodEnabled !== false,
    magnetEnabled: pricing?.magnetEnabled !== false,
  };
}

export function isMaterialKeyEnabled(
  availability: MaterialAvailability,
  material: Material,
): boolean {
  if (material === "wood") {
    return availability.woodEnabled;
  }
  if (material === "magnet") {
    return availability.magnetEnabled;
  }
  return false;
}

export function hasAnyMaterialEnabled(availability: MaterialAvailability): boolean {
  return availability.woodEnabled || availability.magnetEnabled;
}

function isValidPriceMinor(value: number | null | undefined): value is number {
  return value != null && Number.isInteger(value) && value >= 0;
}

/**
 * Pricing ready when at least one material is enabled and every enabled
 * material has a configured price. Disabled materials do not require prices.
 */
export function isPricingReady(pricing: StoreMaterialPricingLike | undefined | null): boolean {
  if (!pricing) {
    return false;
  }
  const availability = normalizeMaterialAvailability(pricing);
  if (!hasAnyMaterialEnabled(availability)) {
    return false;
  }
  if (availability.woodEnabled && !isValidPriceMinor(pricing.woodPriceMinor)) {
    return false;
  }
  if (availability.magnetEnabled && !isValidPriceMinor(pricing.magnetPriceMinor)) {
    return false;
  }
  return true;
}

export function assertMaterialEnabledForNewOrder(
  material: Material,
  pricing: StoreMaterialPricingLike | undefined | null,
): void {
  const availability = normalizeMaterialAvailability(pricing);
  if (!isMaterialKeyEnabled(availability, material)) {
    throw new MaterialNotAvailableError();
  }
}

export class MaterialNotAvailableError extends Error {
  readonly code = "MATERIAL_UNAVAILABLE" as const;
}
