"use server";

import { revalidatePath } from "next/cache";
import { connectDb } from "@/lib/db/connect";
import { loadExistingShippingIds } from "@/lib/store/loadStoreSettings";
import { buildStoreSettingsPersistUpdate } from "@/lib/store/buildStoreSettingsPersistUpdate";
import {
  normalizeStoreSettingsSave,
  parseStoreSettingsFormPayload,
} from "@/lib/store/storeSettingsSchema";
import { requireAdminSession } from "@/lib/auth/session";
import { STORE_SETTINGS_KEY, StoreSettings } from "@/models/StoreSettings";

export type StoreSettingsFormState = {
  ok?: boolean;
  message?: string;
};

export async function saveStoreSettings(
  _prevState: StoreSettingsFormState,
  formData: FormData,
): Promise<StoreSettingsFormState> {
  await requireAdminSession();

  const payloadRaw = formData.get("payload");
  if (typeof payloadRaw !== "string") {
    return { ok: false, message: "נתונים לא תקינים." };
  }

  let json: unknown;
  try {
    json = JSON.parse(payloadRaw) as unknown;
  } catch {
    return { ok: false, message: "נתונים לא תקינים." };
  }

  const input = parseStoreSettingsFormPayload(json);
  if (!input) {
    return { ok: false, message: "נתונים לא תקינים." };
  }

  const existingIds = await loadExistingShippingIds();
  const normalized = normalizeStoreSettingsSave(input, existingIds);
  if (!normalized.ok) {
    return { ok: false, message: normalized.message };
  }

  await connectDb();

  const persistUpdate = buildStoreSettingsPersistUpdate({
    ...normalized.data,
    shippingMethods: normalized.data.shippingMethods.map((method) => ({
      id: method.id,
      displayName: method.displayName,
      enabled: method.enabled,
      priceMinor: method.priceMinor,
      instructions: method.instructions,
      sortOrder: method.sortOrder,
    })),
  });

  await StoreSettings.findOneAndUpdate(
    { singletonKey: STORE_SETTINGS_KEY },
    { $set: persistUpdate },
    { upsert: true, new: true, runValidators: true },
  );

  revalidatePath("/admin/store-settings");

  return { ok: true, message: "ההגדרות נשמרו" };
}
