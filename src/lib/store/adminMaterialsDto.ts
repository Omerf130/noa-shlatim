import { formatMinorToIlsDisplay } from "@/lib/money/ils";
import { normalizeMaterialAvailability } from "@/lib/store/materialAvailability";
import { loadStoreSettingsDocument } from "@/lib/store/loadStoreSettings";

export type AdminMaterialCardDto = {
  key: "wood" | "magnet";
  displayName: string;
  priceLabel: string;
  enabled: boolean;
  priceConfigured: boolean;
};

export type AdminMaterialsPageDto = {
  materials: AdminMaterialCardDto[];
};

export async function getAdminMaterialsPageDto(): Promise<AdminMaterialsPageDto> {
  const doc = await loadStoreSettingsDocument();
  const pricing = doc?.pricing;
  const availability = normalizeMaterialAvailability(pricing);

  const woodMinor = pricing?.woodPriceMinor ?? null;
  const magnetMinor = pricing?.magnetPriceMinor ?? null;

  return {
    materials: [
      {
        key: "wood",
        displayName: "עץ",
        priceLabel:
          woodMinor != null ? formatMinorToIlsDisplay(woodMinor) : "—",
        enabled: availability.woodEnabled,
        priceConfigured: woodMinor != null,
      },
      {
        key: "magnet",
        displayName: "מגנט",
        priceLabel:
          magnetMinor != null ? formatMinorToIlsDisplay(magnetMinor) : "—",
        enabled: availability.magnetEnabled,
        priceConfigured: magnetMinor != null,
      },
    ],
  };
}
