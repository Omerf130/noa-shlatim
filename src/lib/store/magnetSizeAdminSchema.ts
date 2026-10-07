import { randomUUID } from "crypto";
import { z } from "zod";
import {
  parseIlsErrorMessage,
  parseIlsInputToMinor,
} from "@/lib/money/ils";
import type { StoreMagnetSize } from "@/models/StoreSettings";
import { MAX_MAGNET_SIZES } from "@/lib/store/magnetSizes";

export const magnetSizeInputSchema = z.object({
  id: z.string(),
  name: z.string().max(80),
  dimensionsLabel: z.string().max(80).optional().default(""),
  price: z.string(),
  enabled: z.boolean(),
});

export type MagnetSizeInput = z.infer<typeof magnetSizeInputSchema>;

export const magnetSizesSaveSchema = z.object({
  sizes: z.array(magnetSizeInputSchema).max(MAX_MAGNET_SIZES),
});

export type MagnetSizesSaveInput = z.infer<typeof magnetSizesSaveSchema>;

export type NormalizeMagnetSizesResult =
  | { ok: true; sizes: StoreMagnetSize[] }
  | { ok: false; message: string };

function parseRequiredPriceWhenEnabled(
  raw: string,
  label: string,
): { ok: true; minor: number } | { ok: false; message: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, message: `${label}: נא להזין מחיר כשהגודל פעיל.` };
  }
  const parsed = parseIlsInputToMinor(trimmed);
  if (!parsed.ok) {
    return { ok: false, message: `${label}: ${parseIlsErrorMessage(parsed.code)}` };
  }
  return { ok: true, minor: parsed.minor };
}

function resolveMagnetSizeId(
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
  return { ok: false, message: "גודל מגנט לא תקין." };
}

export function normalizeMagnetSizesSave(
  input: MagnetSizesSaveInput,
  existingIds: Set<string>,
): NormalizeMagnetSizesResult {
  const seenIds = new Set<string>();
  const normalized: StoreMagnetSize[] = [];

  for (let index = 0; index < input.sizes.length; index++) {
    const row = input.sizes[index]!;
    const rowLabel = row.name.trim() || `גודל ${index + 1}`;

    const resolvedId = resolveMagnetSizeId(row.id, existingIds);
    if (!resolvedId.ok) {
      return { ok: false, message: resolvedId.message };
    }
    const id = resolvedId.id;

    if (seenIds.has(id)) {
      return { ok: false, message: "מזהה גודל מגנט כפול." };
    }
    seenIds.add(id);

    let priceMinor: number | null = null;
    if (row.enabled) {
      const name = row.name.trim();
      if (!name) {
        return {
          ok: false,
          message: `${rowLabel}: נא להזין שם כשהגודל פעיל.`,
        };
      }
      const price = parseRequiredPriceWhenEnabled(row.price, rowLabel);
      if (!price.ok) {
        return { ok: false, message: price.message };
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

    normalized.push({
      id,
      name: row.name.trim(),
      dimensionsLabel: row.dimensionsLabel?.trim() ?? "",
      enabled: row.enabled,
      priceMinor,
      sortOrder: index,
    });
  }

  return { ok: true, sizes: normalized };
}

export function parseMagnetSizesFormPayload(raw: unknown): MagnetSizesSaveInput | null {
  const parsed = magnetSizesSaveSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
}
