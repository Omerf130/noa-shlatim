"use server";

import { createBackgroundFromUpload } from "@/lib/backgrounds/createBackground";
import { requireAdminSession } from "@/lib/auth/session";
import { connectDb } from "@/lib/db/connect";
import { Background } from "@/models/Background";
import { revalidatePath } from "next/cache";

export type SetBackgroundEnabledState = {
  ok?: boolean;
  message?: string;
};

export async function setBackgroundEnabled(
  _prev: SetBackgroundEnabledState,
  formData: FormData,
): Promise<SetBackgroundEnabledState> {
  await requireAdminSession();

  const id = formData.get("id");
  const enabledRaw = formData.get("enabled");

  if (typeof id !== "string" || !id.trim()) {
    return { ok: false, message: "רקע לא תקין." };
  }
  if (enabledRaw !== "true" && enabledRaw !== "false") {
    return { ok: false, message: "ערך לא תקין." };
  }

  await connectDb();
  const updated = await Background.updateOne(
    { id: id.trim() },
    { $set: { enabled: enabledRaw === "true" } },
  );
  if (updated.matchedCount === 0) {
    return { ok: false, message: "רקע לא נמצא." };
  }

  revalidatePath("/admin/backgrounds");
  revalidatePath("/create");

  return { ok: true };
}

export type CreateBackgroundFormState = {
  ok?: boolean;
  message?: string;
};

export async function createBackgroundAction(
  _prev: CreateBackgroundFormState,
  formData: FormData,
): Promise<CreateBackgroundFormState> {
  await requireAdminSession();

  const displayName = formData.get("displayName");
  const file = formData.get("image");

  if (typeof displayName !== "string") {
    return { ok: false, message: "נתונים לא תקינים." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "נא לבחור קובץ תמונה." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await createBackgroundFromUpload({
    displayName,
    fileBuffer: buffer,
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  revalidatePath("/admin/backgrounds");
  revalidatePath("/create");

  return { ok: true, message: "הרקע נוסף בהצלחה." };
}
