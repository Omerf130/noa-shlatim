import type { StoreShippingMethod } from "@/models/StoreSettings";

export type StoreSettingsReadiness = {
  documentExists: boolean;
  pricingReady: boolean;
  shippingReady: boolean;
  checkoutReady: boolean;
};

export type PricingLike = {
  woodPriceMinor?: number | null;
  magnetPriceMinor?: number | null;
  woodEnabled?: boolean | null;
  magnetEnabled?: boolean | null;
};

import { isPricingReady } from "@/lib/store/materialAvailability";

export { isPricingReady };

export function isShippingMethodCustomerReady(method: StoreShippingMethod): boolean {
  if (!method.enabled) return false;
  const name = method.displayName?.trim();
  if (!name) return false;
  return method.priceMinor != null && Number.isInteger(method.priceMinor) && method.priceMinor >= 0;
}

export function isShippingReady(methods: StoreShippingMethod[] | undefined | null): boolean {
  if (!methods?.length) return false;
  return methods.some(isShippingMethodCustomerReady);
}

export function computeStoreSettingsReadiness(params: {
  documentExists: boolean;
  pricing: PricingLike | null | undefined;
  shippingMethods: StoreShippingMethod[] | null | undefined;
}): StoreSettingsReadiness {
  const pricingReady = isPricingReady(params.pricing);
  const shippingReady = isShippingReady(params.shippingMethods ?? []);
  return {
    documentExists: params.documentExists,
    pricingReady,
    shippingReady,
    checkoutReady: pricingReady && shippingReady,
  };
}
