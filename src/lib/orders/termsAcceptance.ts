import { z } from "zod";

/** Persisted at payment boundary (Batch B+). Schema only in Batch A. */
export const orderTermsAcceptanceSchema = z.object({
  termsAccepted: z.literal(true),
  termsVersion: z.string().trim().min(1).max(64),
  termsAcceptedAt: z.string().trim().min(1),
});

export type OrderTermsAcceptance = z.infer<typeof orderTermsAcceptanceSchema>;
