import { z } from "zod";

function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-()]/g, "");
}

const phoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(20)
  .transform(normalizePhone)
  .refine(
    (v) => /^0\d{8,9}$/.test(v) || /^\+972\d{8,9}$/.test(v),
    "invalid phone",
  );

const nameSchema = z
  .string()
  .trim()
  .min(2, "min")
  .max(80, "max")
  .refine(
    (v) => /^[\p{L}\p{M}\s'’.-]+$/u.test(v),
    "invalid name",
  );

export const checkoutCustomerSchema = z.object({
  customer: z.object({
    fullName: nameSchema,
    phone: phoneSchema,
    email: z.string().trim().email().max(254),
  }),
  notes: z.string().trim().max(500).optional().default(""),
});

export type CheckoutCustomerPayload = z.infer<typeof checkoutCustomerSchema>;

export function formatCheckoutValidationError(issue: z.ZodIssue): string {
  const path = issue.path.join(".");
  if (path.includes("fullName")) {
    return "נא להזין שם מלא תקין (לפחות 2 תווים).";
  }
  if (path.includes("phone")) {
    return "נא להזין מספר טלפון ישראלי תקין.";
  }
  if (path.includes("email")) {
    return "נא להזין כתובת אימייל תקינה.";
  }
  if (path.includes("notes")) {
    return "הערות ארוכות מדי (מקסימום 500 תווים).";
  }
  return "פרטים לא תקינים.";
}
