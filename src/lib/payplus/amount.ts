import { MAX_ILS_MINOR } from "@/lib/money/ils";

/**
 * PayPlus PaymentPages `amount` field conversion boundary.
 *
 * Internal money is integer agorot (minor units). PayPlus docs/examples use
 * major ILS units (e.g. amount: 1 => ₪1.00). Exact contract is verified in
 * Batch E before the production ₪1 test — do not assume elsewhere.
 */

export type PayPlusAmountConversionError = "INVALID_MINOR" | "NON_INTEGER_MAJOR";

/**
 * Convert order snapshot total (agorot) to PayPlus generateLink amount.
 * No network I/O — safe to import anywhere server-side.
 */
export function orderMinorToPayPlusAmount(totalAmountMinor: number): number {
  if (
    !Number.isInteger(totalAmountMinor) ||
    totalAmountMinor < 0 ||
    totalAmountMinor > MAX_ILS_MINOR
  ) {
    throw new Error("INVALID_MINOR");
  }
  return totalAmountMinor / 100;
}

/**
 * Convert PayPlus callback/charge amount back to agorot for comparison with snapshot.
 * Returns null if the value cannot map safely to integer minor units.
 */
export function payPlusAmountToOrderMinor(
  amount: number,
): { ok: true; minor: number } | { ok: false; reason: PayPlusAmountConversionError } {
  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, reason: "INVALID_MINOR" };
  }
  const minor = Math.round(amount * 100);
  if (!Number.isSafeInteger(minor) || minor > MAX_ILS_MINOR) {
    return { ok: false, reason: "INVALID_MINOR" };
  }
  if (Math.abs(amount * 100 - minor) > 1e-6) {
    return { ok: false, reason: "NON_INTEGER_MAJOR" };
  }
  return { ok: true, minor };
}
