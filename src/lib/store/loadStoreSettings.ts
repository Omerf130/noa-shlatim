import { connectDb } from "@/lib/db/connect";
import {
  STORE_SETTINGS_KEY,
  StoreSettings,
  type StoreShippingMethod,
} from "@/models/StoreSettings";

export type StoreSettingsLean = {
  currency: "ILS";
  pricing: {
    woodPriceMinor?: number | null;
    magnetPriceMinor?: number | null;
  };
  shippingMethods: StoreShippingMethod[];
  createdAt?: Date;
  updatedAt?: Date;
};

export async function loadStoreSettingsDocument(): Promise<StoreSettingsLean | null> {
  await connectDb();
  const doc = await StoreSettings.findOne({ singletonKey: STORE_SETTINGS_KEY }).lean();
  if (!doc) {
    return null;
  }

  const methods = [...(doc.shippingMethods ?? [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );

  return {
    currency: "ILS",
    pricing: {
      woodPriceMinor: doc.pricing?.woodPriceMinor ?? null,
      magnetPriceMinor: doc.pricing?.magnetPriceMinor ?? null,
    },
    shippingMethods: methods as StoreShippingMethod[],
    createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
  };
}

export async function loadExistingShippingIds(): Promise<Set<string>> {
  const doc = await loadStoreSettingsDocument();
  if (!doc) {
    return new Set();
  }
  return new Set(doc.shippingMethods.map((m) => m.id));
}
