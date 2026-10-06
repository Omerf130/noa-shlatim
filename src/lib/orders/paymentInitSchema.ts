import { z } from "zod";

export const paymentInitBodySchema = z
  .object({
    termsAccepted: z.literal(true),
  })
  .strict();

export type PaymentInitBody = z.infer<typeof paymentInitBodySchema>;

export function parsePaymentInitBody(raw: unknown): PaymentInitBody | null {
  const parsed = paymentInitBodySchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
