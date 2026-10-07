import { z } from "zod";
import {
  validatePayPlusCardLastFour,
  validatePayPlusNumberOfPayments,
} from "@/lib/payplus/payPlusCardDetails";

const payPlusTransactionPaymentsSchema = z
  .object({
    number_of_payments: z.union([z.number(), z.string()]).optional(),
  })
  .optional();

const payPlusTransactionSchema = z.object({
  uid: z.string().trim().min(1).max(128),
  payment_request_uid: z.string().trim().min(1).max(128).optional(),
  status_code: z.string().trim().min(1).max(16),
  amount: z.number(),
  currency: z.string().trim().min(1).max(8),
  more_info: z.string().optional(),
  more_info_2: z.string().optional(),
  payments: payPlusTransactionPaymentsSchema,
});

const payPlusCallbackDataSchema = z
  .object({
    card_information: z
      .object({
        four_digits: z.string().optional(),
      })
      .optional(),
  })
  .optional();

const payPlusCallbackEnvelopeSchema = z.object({
  transaction_type: z.string().trim().min(1).max(64).optional(),
  transaction: payPlusTransactionSchema,
  data: payPlusCallbackDataSchema,
});

export type PayPlusCallbackTransaction = z.infer<typeof payPlusTransactionSchema>;

export type PayPlusCallbackCardDetailsPersistable = {
  payplusCardLastFourDigits?: string;
  payplusNumberOfPayments?: number;
};

export type PayPlusCallbackPayload = {
  transactionType: string | undefined;
  transaction: PayPlusCallbackTransaction;
  cardDetailsForPersistence: PayPlusCallbackCardDetailsPersistable;
};

export type PayPlusCallbackParseResult =
  | { ok: true; payload: PayPlusCallbackPayload }
  | { ok: false; reason: "INVALID_JSON" | "INVALID_SHAPE" };

export function extractPayPlusCardDetailsForPersistence(
  transaction: PayPlusCallbackTransaction,
  data: z.infer<typeof payPlusCallbackDataSchema>,
): PayPlusCallbackCardDetailsPersistable {
  const out: PayPlusCallbackCardDetailsPersistable = {};

  const lastFour = validatePayPlusCardLastFour(data?.card_information?.four_digits);
  if (lastFour) {
    out.payplusCardLastFourDigits = lastFour;
  }

  const installments = validatePayPlusNumberOfPayments(
    transaction.payments?.number_of_payments,
  );
  if (installments !== null) {
    out.payplusNumberOfPayments = installments;
  }

  return out;
}

export function parsePayPlusCallbackPayload(rawBody: string): PayPlusCallbackParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody) as unknown;
  } catch {
    return { ok: false, reason: "INVALID_JSON" };
  }

  const result = payPlusCallbackEnvelopeSchema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, reason: "INVALID_SHAPE" };
  }

  const cardDetailsForPersistence = extractPayPlusCardDetailsForPersistence(
    result.data.transaction,
    result.data.data,
  );

  return {
    ok: true,
    payload: {
      transactionType: result.data.transaction_type,
      transaction: result.data.transaction,
      cardDetailsForPersistence,
    },
  };
}
