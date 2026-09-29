import { randomUUID } from "crypto";
import { z } from "zod";
import {
  parseIlsInputToMinor,
  parseIlsErrorMessage,
} from "@/lib/money/ils";

const MAX_SHIPPING_METHODS = 20;

export const shippingMethodInputSchema = z.object({
  id: z.string(),
  displayName: z.string().max(80),
  price: z.string(),
  enabled: z.boolean(),
  instructions: z.string().max(300).optional().default(""),
});

export type ShippingMethodInput = z.infer<typeof shippingMethodInputSchema>;

export const storeSettingsSaveSchema = z.object({
  woodPrice: z.string(),
  magnetPrice: z.string(),
  shippingMethods: z.array(shippingMethodInputSchema).max(MAX_SHIPPING_METHODS),
});

export type StoreSettingsSaveInput = z.infer<typeof storeSettingsSaveSchema>;

export type NormalizedStoreSettingsSave = {
  woodPriceMinor: number | null;
  magnetPriceMinor: number | null;
  shippingMethods: Array<{
    id: string;
    displayName: string;
    enabled: boolean;
    priceMinor: number | null;
    instructions: string;
    sortOrder: number;
  }>;
};

export type NormalizeStoreSettingsResult =
  | { ok: true; data: NormalizedStoreSettingsSave }
  | { ok: false; message: string; field?: string };

function parseOptionalPrice(
  raw: string,
  fieldLabel: string,
): { ok: true; minor: number | null } | { ok: false; message: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: true, minor: null };
  }
  const parsed = parseIlsInputToMinor(trimmed);
  if (!parsed.ok) {
    return { ok: false, message: `${fieldLabel}: ${parseIlsErrorMessage(parsed.code)}` };
  }
  return { ok: true, minor: parsed.minor };
}

function parseRequiredPriceWhenEnabled(
  raw: string,
  methodLabel: string,
): { ok: true; minor: number } | { ok: false; message: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, message: `${methodLabel}: נא להזין מחיר כשהשיטה פעילה.` };
  }
  const parsed = parseIlsInputToMinor(trimmed);
  if (!parsed.ok) {
    return { ok: false, message: `${methodLabel}: ${parseIlsErrorMessage(parsed.code)}` };
  }
  return { ok: true, minor: parsed.minor };
}

function resolveShippingMethodId(
  rawId: string,
  existingIds: Set<string>,
): { ok: true; id: string } | { ok: false; message: string } {
  const id = rawId.trim();
  if (!id || id.startsWith("new:")) {
    return { ok: true, id: randomUUID() };
  }
  if (existingIds.has(id)) {
    return { ok: true, id };
  }
  return { ok: false, message: "שיטת משלוח לא תקינה." };
}

export function normalizeStoreSettingsSave(
  input: StoreSettingsSaveInput,
  existingIds: Set<string>,
): NormalizeStoreSettingsResult {
  const wood = parseOptionalPrice(input.woodPrice, "מחיר שלט עץ");
  if (!wood.ok) return { ok: false, message: wood.message, field: "woodPrice" };

  const magnet = parseOptionalPrice(input.magnetPrice, "מחיר שלט מגנט");
  if (!magnet.ok) return { ok: false, message: magnet.message, field: "magnetPrice" };

  const seenIds = new Set<string>();
  const normalizedMethods: NormalizedStoreSettingsSave["shippingMethods"] = [];

  for (let index = 0; index < input.shippingMethods.length; index++) {
    const row = input.shippingMethods[index]!;
    const methodLabel = row.displayName.trim() || `שיטת משלוח ${index + 1}`;

    const resolvedId = resolveShippingMethodId(row.id, existingIds);
    if (!resolvedId.ok) {
      return { ok: false, message: resolvedId.message, field: "shipping" };
    }
    const id = resolvedId.id;

    if (seenIds.has(id)) {
      return { ok: false, message: "מזהה שיטת משלוח כפול.", field: "shipping" };
    }
    seenIds.add(id);

    let priceMinor: number | null = null;
    if (row.enabled) {
      const name = row.displayName.trim();
      if (!name) {
        return {
          ok: false,
          message: `${methodLabel}: נא להזין שם כשהשיטה פעילה.`,
          field: "shipping",
        };
      }
      const price = parseRequiredPriceWhenEnabled(row.price, methodLabel);
      if (!price.ok) {
        return { ok: false, message: price.message, field: "shipping" };
      }
      priceMinor = price.minor;
    } else {
      const trimmedPrice = row.price.trim();
      if (trimmedPrice) {
        const optional = parseIlsInputToMinor(trimmedPrice);
        if (optional.ok) {
          priceMinor = optional.minor;
        }
      }
    }

    normalizedMethods.push({
      id,
      displayName: row.displayName.trim(),
      enabled: row.enabled,
      priceMinor,
      instructions: row.instructions?.trim() ?? "",
      sortOrder: index,
    });
  }

  return {
    ok: true,
    data: {
      woodPriceMinor: wood.minor,
      magnetPriceMinor: magnet.minor,
      shippingMethods: normalizedMethods,
    },
  };
}

export function parseStoreSettingsFormPayload(raw: unknown): StoreSettingsSaveInput | null {
  const parsed = storeSettingsSaveSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
}
