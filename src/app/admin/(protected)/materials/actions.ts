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
