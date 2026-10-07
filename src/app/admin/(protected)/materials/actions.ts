"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/session";
import { connectDb } from "@/lib/db/connect";
import { STORE_SETTINGS_KEY, StoreSettings } from "@/models/StoreSettings";

export type SetMaterialEnabledState = {
  ok?: boolean;
  message?: string;
};

export async function setMaterialEnabled(
  _prev: SetMaterialEnabledState,
  formData: FormData,
): Promise<SetMaterialEnabledState> {
  await requireAdminSession();

  const material = formData.get("material");
  const enabledRaw = formData.get("enabled");

  if (material !== "wood" && material !== "magnet") {
    return { ok: false, message: "חומר לא תקין." };
  }
  if (enabledRaw !== "true" && enabledRaw !== "false") {
    return { ok: false, message: "ערך לא תקין." };
  }

  const enabled = enabledRaw === "true";
  const field = material === "wood" ? "pricing.woodEnabled" : "pricing.magnetEnabled";

  await connectDb();
  await StoreSettings.findOneAndUpdate(
    { singletonKey: STORE_SETTINGS_KEY },
    {
      $set: {
        singletonKey: STORE_SETTINGS_KEY,
        currency: "ILS",
        [field]: enabled,
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  revalidatePath("/admin/materials");
  revalidatePath("/create");

  return { ok: true };
}

export type SaveMagnetSizesState = {
  ok?: boolean;
  message?: string;
};

export async function saveMagnetSizes(
  _prev: SaveMagnetSizesState,
  formData: FormData,
): Promise<SaveMagnetSizesState> {
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

  const { loadExistingMagnetSizeIds } = await import("@/lib/store/loadStoreSettings");
  const {
    normalizeMagnetSizesSave,
    parseMagnetSizesFormPayload,
  } = await import("@/lib/store/magnetSizeAdminSchema");

  const input = parseMagnetSizesFormPayload(json);
  if (!input) {
    return { ok: false, message: "נתונים לא תקינים." };
  }

  const existingIds = await loadExistingMagnetSizeIds();
  const normalized = normalizeMagnetSizesSave(input, existingIds);
  if (!normalized.ok) {
    return { ok: false, message: normalized.message };
  }

  await connectDb();
  await StoreSettings.findOneAndUpdate(
    { singletonKey: STORE_SETTINGS_KEY },
    {
      $set: {
        singletonKey: STORE_SETTINGS_KEY,
        currency: "ILS",
        magnetSizes: normalized.sizes,
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  revalidatePath("/admin/materials");
  revalidatePath("/admin/store-settings");
  revalidatePath("/create");

  return { ok: true, message: "גדלי המגנט נשמרו" };
}
