import { z } from "zod";
import {
  parseIlsErrorMessage,
  parseIlsInputToMinor,
} from "@/lib/money/ils";
import type { StoreMagnetSize } from "@/models/StoreSettings";

export const PROMOTION_REQUIREMENT_MATERIALS = ["magnet"] as const;

export const promotionRequirementSchema = z.object({
  material: z.literal("magnet"),
  magnetSizeId: z.string().trim().min(1).max(64),
  quantity: z.number().int().min(1).max(20),
});

export type PromotionRequirement = z.infer<typeof promotionRequirementSchema>;

export const promotionPersistSchema = z
  .object({
    promotionId: z.string().uuid(),
    internalName: z.string().trim().min(1).max(120),
    bannerText: z.string().trim().max(500),
    enabled: z.boolean(),
    showInBanner: z.boolean(),
    bannerSortOrder: z.number().int().min(-1000).max(1000),
    bundlePriceMinor: z.number().int().min(0),
    requirements: z.array(promotionRequirementSchema).min(1).max(20),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>();
    for (let i = 0; i < data.requirements.length; i++) {
      const req = data.requirements[i]!;
      if (seen.has(req.magnetSizeId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "duplicate magnet size",
          path: ["requirements", i, "magnetSizeId"],
        });
      }
      seen.add(req.magnetSizeId);
    }
    if (data.showInBanner && !data.bannerText.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "banner text required",
        path: ["bannerText"],
      });
    }
  });

export type PromotionPersist = z.infer<typeof promotionPersistSchema>;

export type PromotionFormRequirementInput = {
  magnetSizeId: string;
  quantity: number;
};

export type PromotionFormInput = {
  internalName: string;
  bundlePriceIls: string;
  enabled: boolean;
  showInBanner: boolean;
  bannerText: string;
  bannerSortOrder: number;
  requirements: PromotionFormRequirementInput[];
};

const promotionFormPayloadSchema = z.object({
  internalName: z.string(),
  bundlePriceIls: z.string(),
  enabled: z.boolean(),
  showInBanner: z.boolean(),
  bannerText: z.string(),
  bannerSortOrder: z.coerce.number(),
  requirements: z.array(
    z.object({
      magnetSizeId: z.string(),
      quantity: z.coerce.number(),
    }),
  ),
});

export function parsePromotionFormPayload(raw: unknown): PromotionFormInput | null {
  const parsed = promotionFormPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
}

export type NormalizePromotionSaveResult =
  | { ok: true; data: PromotionPersist }
  | { ok: false; message: string };

export function normalizePromotionSave(params: {
  promotionId: string;
  input: PromotionFormInput;
  persistedMagnetSizes: StoreMagnetSize[];
}): NormalizePromotionSaveResult {
  const name = params.input.internalName.trim();
  if (!name) {
    return { ok: false, message: "יש להזין שם פנימי למבצע." };
  }

  const priceParsed = parseIlsInputToMinor(params.input.bundlePriceIls.trim());
  if (!priceParsed.ok) {
    return {
      ok: false,
      message: `מחיר המבצע: ${parseIlsErrorMessage(priceParsed.code)}`,
    };
  }

  if (!Number.isInteger(params.input.bannerSortOrder)) {
    return { ok: false, message: "סדר תצוגה בבאנר אינו תקין." };
  }

  const sizeById = new Map(
    params.persistedMagnetSizes.map((s) => [s.id.trim(), s] as const),
  );

  const requirements: PromotionRequirement[] = [];
  if (params.input.requirements.length === 0) {
    return { ok: false, message: "יש להוסיף לפחות גודל מגנט אחד למבצע." };
  }

  for (const row of params.input.requirements) {
    const magnetSizeId = row.magnetSizeId.trim();
    if (!magnetSizeId) {
      return { ok: false, message: "יש לבחור גודל מגנט בכל שורה." };
    }
    if (!sizeById.has(magnetSizeId)) {
      return { ok: false, message: "גודל מגנט שנבחר אינו קיים בהגדרות החנות." };
    }
    const qty = row.quantity;
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) {
      return { ok: false, message: "כמות חייבת להיות בין 1 ל-20." };
    }
    requirements.push({
      material: "magnet",
      magnetSizeId,
      quantity: qty,
    });
  }

  const persistCandidate = {
    promotionId: params.promotionId,
    internalName: name,
    bannerText: params.input.bannerText.trim(),
    enabled: params.input.enabled,
    showInBanner: params.input.showInBanner,
    bannerSortOrder: params.input.bannerSortOrder,
    bundlePriceMinor: priceParsed.minor,
    requirements,
  };

  const validated = promotionPersistSchema.safeParse(persistCandidate);
  if (!validated.success) {
    const first = validated.error.issues[0];
    if (first?.path.join(".") === "bannerText") {
      return { ok: false, message: "יש להזין טקסט באנר כאשר «הצג בבאנר» מסומן." };
    }
    if (first?.message === "duplicate magnet size") {
      return { ok: false, message: "לא ניתן לבחור אותו גודל מגנט פעמיים באותו מבצע." };
    }
    return { ok: false, message: "נתוני המבצע אינם תקינים." };
  }

  return { ok: true, data: validated.data };
}

export type RequirementCatalogStatus =
  | { status: "ok" }
  | { status: "disabled"; sizeName: string }
  | { status: "missing" };

export function requirementCatalogStatus(
  magnetSizeId: string,
  persistedMagnetSizes: StoreMagnetSize[],
): RequirementCatalogStatus {
  const size = persistedMagnetSizes.find((s) => s.id === magnetSizeId);
  if (!size) {
    return { status: "missing" };
  }
  if (!size.enabled) {
    return { status: "disabled", sizeName: size.name?.trim() || magnetSizeId };
  }
  const price = size.priceMinor;
  if (price == null || !Number.isInteger(price) || price < 0) {
    return { status: "disabled", sizeName: size.name?.trim() || magnetSizeId };
  }
  return { status: "ok" };
}

export function computeRequirementsCatalogTotalMinor(params: {
  requirements: PromotionRequirement[];
  persistedMagnetSizes: StoreMagnetSize[];
}): { ok: true; totalMinor: number } | { ok: false; reason: "missing_price" } {
  let total = 0;
  for (const req of params.requirements) {
    const size = params.persistedMagnetSizes.find((s) => s.id === req.magnetSizeId);
    if (!size) {
      return { ok: false, reason: "missing_price" };
    }
    const price = size.priceMinor;
    if (price == null || !Number.isInteger(price) || price < 0) {
      return { ok: false, reason: "missing_price" };
    }
    total += price * req.quantity;
    if (!Number.isSafeInteger(total)) {
      return { ok: false, reason: "missing_price" };
    }
  }
  return { ok: true, totalMinor: total };
}

export const PROMOTION_NO_SAVINGS_WARNING =
  "מחיר המבצע אינו נמוך מסכום המחירים הרגילים של הפריטים — המבצע לא יחול אוטומטית (עד לעדכון מחירים).";

export function promotionPriceWarning(
  bundlePriceMinor: number,
  catalogTotalMinor: number | null,
): string | null {
  if (catalogTotalMinor == null) {
    return null;
  }
  if (bundlePriceMinor >= catalogTotalMinor) {
    return PROMOTION_NO_SAVINGS_WARNING;
  }
  return null;
}
