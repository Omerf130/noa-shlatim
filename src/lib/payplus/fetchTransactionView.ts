import type { PayPlusConfig } from "@/lib/payplus/env";
import {
  validatePayPlusCardLastFour,
  validatePayPlusNumberOfPayments,
  type ValidatedPayPlusCardDetails,
} from "@/lib/payplus/payPlusCardDetails";
import type { PayPlusFetchFn } from "@/lib/payplus/generatePaymentLink";

export type FetchTransactionViewResult =
  | { ok: true; card: ValidatedPayPlusCardDetails }
  | { ok: false; reason: "HTTP" | "PARSE" | "MISSING_FIELDS" | "TIMEOUT" };

const VIEW_PATH = "/Transactions/View";
const REQUEST_TIMEOUT_MS = 20_000;

function parseTransactionViewCard(json: unknown): ValidatedPayPlusCardDetails | null {
  if (json === null || typeof json !== "object") {
    return null;
  }
  const root = json as Record<string, unknown>;
  const data = root.data;
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const first = data[0];
  if (first === null || typeof first !== "object") {
    return null;
  }
  const row = first as Record<string, unknown>;
  const tx = row.transaction;
  const rowData = row.data;

  let numberOfPaymentsRaw: unknown;
  if (tx !== null && typeof tx === "object") {
    const payments = (tx as Record<string, unknown>).payments;
    if (payments !== null && typeof payments === "object") {
      numberOfPaymentsRaw = (payments as Record<string, unknown>).number_of_payments;
    }
  }

  let fourDigitsRaw: unknown;
  if (rowData !== null && typeof rowData === "object") {
    const cardInfo = (rowData as Record<string, unknown>).card_information;
    if (cardInfo !== null && typeof cardInfo === "object") {
      fourDigitsRaw = (cardInfo as Record<string, unknown>).four_digits;
    }
  }

  const payplusCardLastFourDigits = validatePayPlusCardLastFour(fourDigitsRaw);
  const payplusNumberOfPayments = validatePayPlusNumberOfPayments(numberOfPaymentsRaw);

  if (!payplusCardLastFourDigits || payplusNumberOfPayments === null) {
    return null;
  }

  return { payplusCardLastFourDigits, payplusNumberOfPayments };
}

export async function fetchPayPlusTransactionViewCardDetails(params: {
  config: PayPlusConfig;
  payplusTransactionUid: string;
  fetchFn?: PayPlusFetchFn;
}): Promise<FetchTransactionViewResult> {
  const fetchImpl = params.fetchFn ?? fetch;
  const url = `${params.config.apiBaseUrl}${VIEW_PATH}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": params.config.apiKey,
        "secret-key": params.config.secretKey,
      },
      body: JSON.stringify({ transaction_uid: params.payplusTransactionUid }),
      signal: controller.signal,
    });

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      return { ok: false, reason: "PARSE" };
    }

    if (!res.ok) {
      return { ok: false, reason: "HTTP" };
    }

    const card = parseTransactionViewCard(json);
    if (!card) {
      return { ok: false, reason: "MISSING_FIELDS" };
    }

    return { ok: true, card };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, reason: "TIMEOUT" };
    }
    return { ok: false, reason: "HTTP" };
  } finally {
    clearTimeout(timeout);
  }
}

/** Exported for unit tests. */
export { parseTransactionViewCard };
