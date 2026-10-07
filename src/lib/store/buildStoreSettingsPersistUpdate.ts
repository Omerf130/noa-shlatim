import type { NormalizedStoreSettingsSave } from "@/lib/store/storeSettingsSchema";
import { STORE_SETTINGS_KEY } from "@/models/StoreSettings";

export type StoreSettingsPersistUpdate = {
  singletonKey: typeof STORE_SETTINGS_KEY;
  currency: "ILS";
  "pricing.woodPriceMinor": number | null;
  "pricing.magnetPriceMinor": number | null;
  shippingMethods: NormalizedStoreSettingsSave["shippingMethods"];
};

/** Mongo $set payload — dotted pricing paths preserve woodEnabled/magnetEnabled. */
export function buildStoreSettingsPersistUpdate(
  data: NormalizedStoreSettingsSave,
): StoreSettingsPersistUpdate {
  return {
    singletonKey: STORE_SETTINGS_KEY,
    currency: "ILS",
    "pricing.woodPriceMinor": data.woodPriceMinor,
    "pricing.magnetPriceMinor": data.magnetPriceMinor,
    shippingMethods: data.shippingMethods,
  };
}
