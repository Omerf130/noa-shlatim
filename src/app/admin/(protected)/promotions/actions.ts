"use server";

import { revalidatePublicPromotionBannerSurfaces } from "@/lib/promotions/revalidatePublicPromotionBanner";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth/session";
import { connectDb } from "@/lib/db/connect";
import {
  computeRequirementsCatalogTotalMinor,
  normalizePromotionSave,
  parsePromotionFormPayload,
  promotionPriceWarning,
} from "@/lib/promotions/promotionSchema";
import { loadStoreSettingsDocument } from "@/lib/store/loadStoreSettings";
import { Promotion } from "@/models/Promotion";
import { randomUUID } from "node:crypto";

export type PromotionFormState = {
  ok?: boolean;
  message?: string;
  warning?: string | null;
};

export type SetPromotionEnabledState = {
  ok?: boolean;
  message?: string;
};

function parsePayloadFromForm(formData: FormData): unknown | null {
  const payloadRaw = formData.get("payload");
  if (typeof payloadRaw !== "string") {
    return null;
  }
  try {
    return JSON.parse(payloadRaw) as unknown;
  } catch {
    return null;
  }
}

export async function createPromotionAction(
  _prev: PromotionFormState,
  formData: FormData,
): Promise<PromotionFormState> {
  await requireAdminSession();

  const json = parsePayloadFromForm(formData);
  const input = parsePromotionFormPayload(json);
  if (!input) {
    return { ok: false, message: "נתונים לא תקינים." };
  }

  const settings = await loadStoreSettingsDocument();
  const sizes = settings?.magnetSizes ?? [];
  if (sizes.length === 0) {
    return { ok: false, message: "יש להגדיר גדלי מגנט לפני יצירת מבצע." };
  }

  const promotionId = randomUUID();
  const normalized = normalizePromotionSave({
    promotionId,
    input,
    persistedMagnetSizes: sizes,
  });
  if (!normalized.ok) {
    return { ok: false, message: normalized.message };
  }

  const catalog = computeRequirementsCatalogTotalMinor({
    requirements: normalized.data.requirements,
    persistedMagnetSizes: sizes,
  });
  const warning = promotionPriceWarning(
    normalized.data.bundlePriceMinor,
    catalog.ok ? catalog.totalMinor : null,
  );

  await connectDb();
  await Promotion.create(normalized.data);

  revalidatePath("/admin/promotions");
  revalidatePublicPromotionBannerSurfaces();

  return {
    ok: true,
    message: "המבצע נוצר.",
    warning,
  };
}

export async function updatePromotionAction(
  _prev: PromotionFormState,
  formData: FormData,
): Promise<PromotionFormState> {
  await requireAdminSession();

  const promotionIdRaw = formData.get("promotionId");
  if (typeof promotionIdRaw !== "string" || !promotionIdRaw.trim()) {
    return { ok: false, message: "מבצע לא תקין." };
  }
  const promotionId = promotionIdRaw.trim();

  const json = parsePayloadFromForm(formData);
  const input = parsePromotionFormPayload(json);
  if (!input) {
    return { ok: false, message: "נתונים לא תקינים." };
  }

  const settings = await loadStoreSettingsDocument();
  const sizes = settings?.magnetSizes ?? [];

  const normalized = normalizePromotionSave({
    promotionId,
    input,
    persistedMagnetSizes: sizes,
  });
  if (!normalized.ok) {
    return { ok: false, message: normalized.message };
  }

  const catalog = computeRequirementsCatalogTotalMinor({
    requirements: normalized.data.requirements,
    persistedMagnetSizes: sizes,
  });
  const warning = promotionPriceWarning(
    normalized.data.bundlePriceMinor,
    catalog.ok ? catalog.totalMinor : null,
  );

  await connectDb();
  const updated = await Promotion.findOneAndUpdate(
    { promotionId },
    { $set: normalized.data },
    { new: true, runValidators: true },
  );
  if (!updated) {
    return { ok: false, message: "מבצע לא נמצא." };
  }

  revalidatePath("/admin/promotions");
  revalidatePath(`/admin/promotions/${promotionId}`);
  revalidatePublicPromotionBannerSurfaces();

  return {
    ok: true,
    message: "המבצע נשמר.",
    warning,
  };
}

export async function setPromotionEnabled(
  _prev: SetPromotionEnabledState,
  formData: FormData,
): Promise<SetPromotionEnabledState> {
  await requireAdminSession();

  const promotionId = formData.get("promotionId");
  const enabledRaw = formData.get("enabled");

  if (typeof promotionId !== "string" || !promotionId.trim()) {
    return { ok: false, message: "מבצע לא תקין." };
  }
  if (enabledRaw !== "true" && enabledRaw !== "false") {
    return { ok: false, message: "ערך לא תקין." };
  }

  await connectDb();
  const updated = await Promotion.updateOne(
    { promotionId: promotionId.trim() },
    { $set: { enabled: enabledRaw === "true" } },
  );
  if (updated.matchedCount === 0) {
    return { ok: false, message: "מבצע לא נמצא." };
  }

  revalidatePath("/admin/promotions");
  revalidatePath(`/admin/promotions/${promotionId.trim()}`);
  revalidatePublicPromotionBannerSurfaces();

  return { ok: true };
}
