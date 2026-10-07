import type { OrderCommercialSnapshot } from "@/lib/orders/commercialSnapshot";
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
    cardNumber: string;
    numberPayments: number;
    transactionNumber: string;
  }>;
};

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
  snapshot: OrderCommercialSnapshot;
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
        cardNumber: params.card.payplusCardLastFourDigits,
        numberPayments: params.card.payplusNumberOfPayments,
        transactionNumber: params.payplusTransactionUid,
      },
    ],
  };
}
