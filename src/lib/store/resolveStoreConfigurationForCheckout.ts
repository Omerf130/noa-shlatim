import { normalizeMaterialAvailability } from "@/lib/store/materialAvailability";
import {
  isPricingReady,
  isShippingMethodCustomerReady,
} from "@/lib/store/storeSettingsCompleteness";
import { loadStoreSettingsDocument } from "@/lib/store/loadStoreSettings";
import type { Material } from "@/types/signDesign";

export type StoreConfigurationFailureReason =
  | "NOT_CONFIGURED"
  | "PRICING_INCOMPLETE"
  | "SHIPPING_UNAVAILABLE";

export type StoreConfigurationForCheckout =
  | {
      ok: true;
      currency: "ILS";
      materialPrices: Partial<Record<Material, number>>;
      shippingMethods: Array<{
        methodId: string;
        displayName: string;
        priceMinor: number;
        instructions: string;
      }>;
    }
  | {
      ok: false;
      reason: StoreConfigurationFailureReason;
    };

/**
 * Authoritative store config for future Checkout (server-only).
 * Fails closed when pricing or shipping is incomplete.
 */
export async function resolveStoreConfigurationForCheckout(): Promise<StoreConfigurationForCheckout> {
  const doc = await loadStoreSettingsDocument();
  if (!doc) {
    return { ok: false, reason: "NOT_CONFIGURED" };
  }

  if (!isPricingReady(doc.pricing)) {
    return { ok: false, reason: "PRICING_INCOMPLETE" };
  }

  const availability = normalizeMaterialAvailability(doc.pricing);
  const materialPrices: Partial<Record<Material, number>> = {};
  if (
    availability.woodEnabled &&
    doc.pricing.woodPriceMinor != null &&
    Number.isInteger(doc.pricing.woodPriceMinor)
  ) {
    materialPrices.wood = doc.pricing.woodPriceMinor;
  }
  if (
    availability.magnetEnabled &&
    doc.pricing.magnetPriceMinor != null &&
    Number.isInteger(doc.pricing.magnetPriceMinor)
  ) {
    materialPrices.magnet = doc.pricing.magnetPriceMinor;
  }

  const shippingMethods = doc.shippingMethods
    .filter(isShippingMethodCustomerReady)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((m) => ({
      methodId: m.id,
      displayName: m.displayName.trim(),
      priceMinor: m.priceMinor!,
      instructions: m.instructions?.trim() ?? "",
    }));

  if (shippingMethods.length === 0) {
    return { ok: false, reason: "SHIPPING_UNAVAILABLE" };
  }

  return {
    ok: true,
    currency: "ILS",
    materialPrices,
    shippingMethods,
  };
}

/** Resolve product unit price for a material (server-only, future checkout). */
export function resolveMaterialPriceMinor(
  config: Extract<StoreConfigurationForCheckout, { ok: true }>,
  material: Material,
): number {
  const price = config.materialPrices[material];
  if (price == null) {
    throw new Error("Material not available for checkout");
  }
  return price;
}
