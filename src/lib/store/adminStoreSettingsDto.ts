import { formatMinorToIlsInput } from "@/lib/money/ils";
import { computeStoreSettingsReadiness } from "@/lib/store/storeSettingsCompleteness";
import type { loadStoreSettingsDocument } from "@/lib/store/loadStoreSettings";

export type AdminShippingMethodDto = {
  id: string;
  displayName: string;
  price: string;
  enabled: boolean;
  instructions: string;
};

export type AdminStoreSettingsDto = {
  documentExists: boolean;
  pricingReady: boolean;
  shippingReady: boolean;
  checkoutReady: boolean;
  showNotConfiguredBanner: boolean;
  updatedAtLabel: string | null;
  woodPrice: string;
  shippingMethods: AdminShippingMethodDto[];
};

function formatUpdatedAt(value: Date | undefined): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

export function buildAdminStoreSettingsDto(
  doc: Awaited<ReturnType<typeof loadStoreSettingsDocument>>,
): AdminStoreSettingsDto {
  const documentExists = doc !== null;
  const readiness = computeStoreSettingsReadiness({
    documentExists,
    pricing: doc ? { ...doc.pricing, magnetSizes: doc.magnetSizes } : null,
    shippingMethods: doc?.shippingMethods,
  });

  return {
    ...readiness,
    showNotConfiguredBanner: !documentExists,
    updatedAtLabel: formatUpdatedAt(doc?.updatedAt),
    woodPrice: formatMinorToIlsInput(doc?.pricing?.woodPriceMinor),
    shippingMethods: (doc?.shippingMethods ?? []).map((m) => ({
      id: m.id,
      displayName: m.displayName ?? "",
      price: formatMinorToIlsInput(m.priceMinor),
      enabled: m.enabled === true,
      instructions: m.instructions ?? "",
    })),
  };
}
