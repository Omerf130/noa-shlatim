import { formatMinorForCheckoutDisplay } from "@/lib/money/ils";
import {
  isLegacyMagnetBridgeActive,
  listCustomerMagnetSizes,
} from "@/lib/store/magnetSizes";
import { loadStoreSettingsDocument } from "@/lib/store/loadStoreSettings";

export type CustomerMagnetSizeDto = {
  id: string;
  name: string;
  dimensionsLabel: string;
  priceMinor: number;
  displayPrice: string;
};

export type CustomerMagnetCatalog = {
  sizes: CustomerMagnetSizeDto[];
  magnetPurchasable: boolean;
  legacyMagnetPricingOnly: boolean;
};

export async function loadCustomerMagnetCatalog(): Promise<CustomerMagnetCatalog> {
  const doc = await loadStoreSettingsDocument();
  const pricing = doc?.pricing;
  const magnetSizes = doc?.magnetSizes ?? [];

  const input = {
    ...pricing,
    magnetSizes,
  };

  const customerSizes = listCustomerMagnetSizes(input).map((s) => ({
    id: s.id,
    name: s.name.trim(),
    dimensionsLabel: s.dimensionsLabel?.trim() ?? "",
    priceMinor: s.priceMinor!,
    displayPrice: formatMinorForCheckoutDisplay(s.priceMinor!),
  }));

  return {
    sizes: customerSizes,
    magnetPurchasable: customerSizes.length > 0 && pricing?.magnetEnabled !== false,
    legacyMagnetPricingOnly: isLegacyMagnetBridgeActive(input),
  };
}
