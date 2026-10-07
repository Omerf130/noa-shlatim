export type ValidatedPayPlusCardDetails = {
  payplusCardLastFourDigits: string;
  payplusNumberOfPayments: number;
};

const FOUR_DIGITS = /^\d{4}$/;

export function validatePayPlusCardLastFour(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  return FOUR_DIGITS.test(trimmed) ? trimmed : null;
}

export function validatePayPlusNumberOfPayments(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isInteger(raw) && raw >= 1) {
    return raw;
  }
  if (typeof raw === "string" && /^\d+$/.test(raw.trim())) {
    const n = Number.parseInt(raw.trim(), 10);
    if (n >= 1) {
      return n;
    }
  }
  return null;
}

export function mergeValidatedPayPlusCardDetails(
  primary: Partial<ValidatedPayPlusCardDetails>,
  fallback: Partial<ValidatedPayPlusCardDetails>,
): ValidatedPayPlusCardDetails | null {
  const payplusCardLastFourDigits =
    primary.payplusCardLastFourDigits ?? fallback.payplusCardLastFourDigits;
  const payplusNumberOfPayments =
    primary.payplusNumberOfPayments ?? fallback.payplusNumberOfPayments;

  if (!payplusCardLastFourDigits || payplusNumberOfPayments === undefined) {
    return null;
  }

  return { payplusCardLastFourDigits, payplusNumberOfPayments };
}
