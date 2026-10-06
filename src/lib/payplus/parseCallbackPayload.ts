import { z } from "zod";

const payPlusTransactionSchema = z.object({
  uid: z.string().trim().min(1).max(128),
  payment_request_uid: z.string().trim().min(1).max(128).optional(),
  status_code: z.string().trim().min(1).max(16),
  amount: z.number(),
  currency: z.string().trim().min(1).max(8),
  more_info: z.string().optional(),
  more_info_2: z.string().optional(),
});

const payPlusCallbackEnvelopeSchema = z.object({
  transaction_type: z.string().trim().min(1).max(64).optional(),
  transaction: payPlusTransactionSchema,
});

export type PayPlusCallbackTransaction = z.infer<typeof payPlusTransactionSchema>;

export type PayPlusCallbackPayload = {
  transactionType: string | undefined;
  transaction: PayPlusCallbackTransaction;
};

export type PayPlusCallbackParseResult =
  | { ok: true; payload: PayPlusCallbackPayload }
  | { ok: false; reason: "INVALID_JSON" | "INVALID_SHAPE" };

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

  return {
    ok: true,
    payload: {
      transactionType: result.data.transaction_type,
      transaction: result.data.transaction,
    },
  };
}
