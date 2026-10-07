import { formatMinorToIlsDisplay, formatMinorToIlsInput } from "@/lib/money/ils";
import {
  isLegacyMagnetBridgeActive,
  isMagnetPurchasable,
  listCustomerMagnetSizes,
} from "@/lib/store/magnetSizes";
import { normalizeMaterialAvailability } from "@/lib/store/materialAvailability";
import { loadStoreSettingsDocument } from "@/lib/store/loadStoreSettings";

export type AdminMaterialCardDto = {
  key: "wood" | "magnet";
  displayName: string;
  priceLabel: string;
  /** Second line under priceLabel (e.g. active size price range for magnet). */
  priceSubLabel: string | null;
  enabled: boolean;
  priceConfigured: boolean;
  priceHint: string | null;
};

function formatActiveMagnetPriceSubLabel(
  customerSizes: Array<{ priceMinor: number | null | undefined }>,
): string | null {
  const prices = customerSizes
    .map((s) => s.priceMinor)
    .filter((p): p is number => p != null && Number.isInteger(p))
    .sort((a, b) => a - b);
  if (prices.length === 0) {
    return null;
  }
  const minLabel = formatMinorToIlsDisplay(prices[0]!);
  const maxLabel = formatMinorToIlsDisplay(prices[prices.length - 1]!);
  if (prices.length === 1 || minLabel === maxLabel) {
    return minLabel;
  }
  return `${minLabel}–${maxLabel}`;
}

export type AdminMagnetSizeRowDto = {
  id: string;
  name: string;
  dimensionsLabel: string;
  price: string;
  enabled: boolean;
};

export type AdminMaterialsPageDto = {
  materials: AdminMaterialCardDto[];
  magnetSizes: AdminMagnetSizeRowDto[];
  legacyMagnetPricingOnly: boolean;
};

export async function getAdminMaterialsPageDto(): Promise<AdminMaterialsPageDto> {
  const doc = await loadStoreSettingsDocument();
  const pricing = doc?.pricing;
  const magnetSizes = doc?.magnetSizes ?? [];
  const availability = normalizeMaterialAvailability(pricing);
  const pricingInput = { ...pricing, magnetSizes };

  const woodMinor = pricing?.woodPriceMinor ?? null;
  const customerSizes = listCustomerMagnetSizes(pricingInput);
  const legacyOnly = isLegacyMagnetBridgeActive(pricingInput);

  let magnetPriceLabel = "—";
  let magnetPriceSubLabel: string | null = null;
  let magnetPriceConfigured = false;
  let magnetPriceHint: string | null = null;

  if (magnetSizes.length > 0) {
    const activeCount = customerSizes.length;
    magnetPriceLabel =
      activeCount > 0
        ? `גדלים פעילים: ${activeCount}`
        : "אין גדלים פעילים";
    magnetPriceSubLabel = formatActiveMagnetPriceSubLabel(customerSizes);
    magnetPriceConfigured = activeCount > 0;
    magnetPriceHint = "ניהול מחירים בגדלים למטה";
  } else if (legacyOnly && pricing?.magnetPriceMinor != null) {
    magnetPriceLabel = "גדלים פעילים: —";
    magnetPriceSubLabel = formatMinorToIlsDisplay(pricing.magnetPriceMinor);
    magnetPriceConfigured = true;
    magnetPriceHint = "מחיר ישן — יש להוסיף גדלים ומחירים";
  } else {
    magnetPriceHint = "הוסיפו גודל מגנט עם מחיר";
  }

  return {
    materials: [
      {
        key: "wood",
        displayName: "עץ",
        priceLabel:
          woodMinor != null ? formatMinorToIlsDisplay(woodMinor) : "—",
        priceSubLabel: null,
        enabled: availability.woodEnabled,
        priceConfigured: woodMinor != null,
        priceHint: woodMinor == null ? "מחיר בהגדרות חנות" : null,
      },
      {
        key: "magnet",
        displayName: "מגנט",
        priceLabel: magnetPriceLabel,
        priceSubLabel: magnetPriceSubLabel,
        enabled: availability.magnetEnabled,
        priceConfigured: magnetPriceConfigured || isMagnetPurchasable(pricingInput),
        priceHint: magnetPriceHint,
      },
    ],
    magnetSizes: magnetSizes.map((s) => ({
      id: s.id,
      name: s.name ?? "",
      dimensionsLabel: s.dimensionsLabel ?? "",
      price: formatMinorToIlsInput(s.priceMinor),
      enabled: s.enabled === true,
    })),
    legacyMagnetPricingOnly: legacyOnly,
  };
}
