/** Technical cap: ₪100,000 — not a business limit. */
export const MAX_ILS_MINOR = 10_000_000;

export type ParseIlsResult =
  | { ok: true; minor: number }
  | { ok: false; code: "EMPTY" | "INVALID" | "NEGATIVE" | "TOO_MANY_DECIMALS" | "TOO_LARGE" };

/**
 * Parse Admin ₪ input to integer agorot. Empty string = not configured (caller uses null in DB).
 * Zero is valid only when Admin explicitly enters "0" or "0.00".
 */
export function parseIlsInputToMinor(raw: string): ParseIlsResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, code: "EMPTY" };
  }

  const normalized = trimmed.replace(/,/g, "");
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) {
    return { ok: false, code: "INVALID" };
  }

  const wholePart = match[1]!;
  const fracPart = match[2] ?? "";

  if (fracPart.length > 2) {
    return { ok: false, code: "TOO_MANY_DECIMALS" };
  }

  const whole = Number.parseInt(wholePart, 10);
  const fracPadded = fracPart.padEnd(2, "0");
  const frac = fracPadded ? Number.parseInt(fracPadded, 10) : 0;

  if (!Number.isFinite(whole) || !Number.isFinite(frac)) {
    return { ok: false, code: "INVALID" };
  }

  const minor = whole * 100 + frac;
  if (!Number.isSafeInteger(minor) || minor > MAX_ILS_MINOR) {
    return { ok: false, code: "TOO_LARGE" };
  }

  return { ok: true, minor };
}

/** Format agorot for Admin display inputs (e.g. 12990 → "129.90"). */
export function formatMinorToIlsInput(minor: number | null | undefined): string {
  if (minor === null || minor === undefined) {
    return "";
  }
  if (!Number.isInteger(minor) || minor < 0) {
    return "";
  }
  const whole = Math.floor(minor / 100);
  const frac = minor % 100;
  if (frac === 0) {
    return String(whole);
  }
  return `${whole}.${String(frac).padStart(2, "0")}`;
}

/** Customer/admin display with ₪ symbol. */
export function formatMinorToIlsDisplay(minor: number): string {
  const input = formatMinorToIlsInput(minor);
  return `₪${input}`;
}

/** Checkout/customer-facing line item. Explicit zero only — never for missing config. */
export function formatMinorForCheckoutDisplay(minor: number): string {
  if (!Number.isInteger(minor) || minor < 0) {
    return "—";
  }
  if (minor === 0) {
    return "חינם";
  }
  return formatMinorToIlsDisplay(minor);
}

export function parseIlsErrorMessage(code: Exclude<ParseIlsResult, { ok: true }>["code"]): string {
  switch (code) {
    case "EMPTY":
      return "נא להזין סכום.";
    case "INVALID":
    case "TOO_MANY_DECIMALS":
      return "סכום לא תקין. ניתן להזין עד שתי ספרות אחרי הנקודה.";
    case "NEGATIVE":
      return "סכום לא יכול להיות שלילי.";
    case "TOO_LARGE":
      return "הסכום גדול מדי.";
    default:
      return "סכום לא תקין.";
  }
}
