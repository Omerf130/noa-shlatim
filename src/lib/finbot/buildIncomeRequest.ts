import { accountingExternalRefForOrder } from "@/lib/orders/accountingDocument";
import type { ValidatedPayPlusCardDetails } from "@/lib/payplus/payPlusCardDetails";
import {
  buildFinbotIncomeLineItems,
  finbotPaymentSumIlsFromSnapshot,
} from "@/lib/finbot/vatLinePrices";

export type FinbotIncomeRequestBody = {
  type: string;
  date: string;
  language: string;
  currency: string;
  rounding: boolean;
  vatType: boolean;
  title: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    save: boolean;
  };
  email: {
    to: string;
  };
  items: Array<{ name: string; amount: number; price: number; save: boolean }>;
  payments: Array<{
    type: string;
    date: string;
    sum: number;
    cardNumber: number;
    numberPayments: number;
    transactionNumber: string;
  }>;
};

const PAYPLUS_LAST_FOUR_DIGITS = /^\d{4}$/;

export class FinbotIncomeRequestBuildError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "FinbotIncomeRequestBuildError";
    this.code = code;
  }
}

/**
 * Maps PayPlus last-four (stored as string) to Finbot `payments.cardNumber` (JSON number).
 * Finbot docs: https://finbot.helpjuice.com/he_IL/E-INT-PRC/api-docs-create-income
 */
export function finbotCardNumberFromPayPlusLastFour(lastFourDigits: string): number {
  const trimmed = lastFourDigits.trim();
  if (!PAYPLUS_LAST_FOUR_DIGITS.test(trimmed)) {
    throw new FinbotIncomeRequestBuildError(
      "4 ספרות אחרונות של כרטיס אינן תקינות להפקת מסמך.",
      "INVALID_CARD_LAST_FOUR",
    );
  }

  if (trimmed.startsWith("0")) {
    throw new FinbotIncomeRequestBuildError(
      "לא ניתן למפות ל-Finbot 4 ספרות שמתחילות ב-0: Finbot דורש מספר JSON, ואפס מוביל אינו נשמר. יש לפנות ל-Finbot לאישור הפורמט.",
      "FINBOT_CARD_LEADING_ZERO",
    );
  }

  const asNumber = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(asNumber) || String(asNumber) !== trimmed) {
    throw new FinbotIncomeRequestBuildError(
      "4 ספרות אחרונות של כרטיס אינן תקינות להפקת מסמך.",
      "INVALID_CARD_LAST_FOUR",
    );
  }

  return asNumber;
}

export function formatFinbotDocumentDateFromIso(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) {
    throw new Error("INVALID_PAYMENT_DATE");
  }
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function buildFinbotIncomeRequest(params: {
  orderId: string;
  snapshot: unknown;
  customer: { fullName: string; email: string; phone: string };
  card: ValidatedPayPlusCardDetails;
  payplusTransactionUid: string;
  paymentCompletedAtIso: string;
}): FinbotIncomeRequestBody {
  const docDate = formatFinbotDocumentDateFromIso(params.paymentCompletedAtIso);
  const items = buildFinbotIncomeLineItems(params.snapshot);

  return {
    type: "2",
    date: docDate,
    language: "he",
    currency: "ILS",
    rounding: true,
    vatType: true,
    title: accountingExternalRefForOrder(params.orderId),
    customer: {
      name: params.customer.fullName.trim(),
      email: params.customer.email.trim(),
      phone: params.customer.phone.trim(),
      save: false,
    },
    email: {
      to: params.customer.email.trim(),
    },
    items: items.map((item) => ({ ...item, save: false })),
    payments: [
      {
        type: "2",
        date: docDate,
        sum: finbotPaymentSumIlsFromSnapshot(params.snapshot),
        cardNumber: finbotCardNumberFromPayPlusLastFour(
          params.card.payplusCardLastFourDigits,
        ),
        numberPayments: params.card.payplusNumberOfPayments,
        transactionNumber: params.payplusTransactionUid,
      },
    ],
  };
}
