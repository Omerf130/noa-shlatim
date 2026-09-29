import { MAX_ILS_MINOR } from "@/lib/money/ils";

export type CheckoutTotalsResult =
  | {
      ok: true;
      productAmountMinor: number;
      shippingAmountMinor: number;
      totalAmountMinor: number;
    }
  | { ok: false; reason: "INVALID_AMOUNT" | "OVERFLOW" };

export function computeCheckoutTotals(
  productAmountMinor: number,
  shippingAmountMinor: number,
): CheckoutTotalsResult {
  if (
    !Number.isInteger(productAmountMinor) ||
    productAmountMinor < 0 ||
    productAmountMinor > MAX_ILS_MINOR
  ) {
    return { ok: false, reason: "INVALID_AMOUNT" };
  }
  if (
    !Number.isInteger(shippingAmountMinor) ||
    shippingAmountMinor < 0 ||
    shippingAmountMinor > MAX_ILS_MINOR
  ) {
    return { ok: false, reason: "INVALID_AMOUNT" };
  }

  const totalAmountMinor = productAmountMinor + shippingAmountMinor;
  if (!Number.isSafeInteger(totalAmountMinor) || totalAmountMinor > MAX_ILS_MINOR) {
    return { ok: false, reason: "OVERFLOW" };
  }

  return {
    ok: true,
    productAmountMinor,
    shippingAmountMinor,
    totalAmountMinor,
  };
}
