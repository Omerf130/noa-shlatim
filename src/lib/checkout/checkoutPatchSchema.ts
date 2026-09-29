import { z } from "zod";
import { checkoutCustomerSchema, formatCheckoutValidationError } from "@/lib/checkout/customerSchema";

export const checkoutPatchSchema = checkoutCustomerSchema
  .extend({
    selectedShippingMethodId: z.string().trim().min(1).max(64),
  })
  .strict();

export type CheckoutPatchPayload = z.infer<typeof checkoutPatchSchema>;

export function parseCheckoutPatchBody(raw: unknown): CheckoutPatchPayload | null {
  const parsed = checkoutPatchSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
}

export function formatCheckoutPatchError(raw: unknown): string {
  const parsed = checkoutPatchSchema.safeParse(raw);
  if (parsed.success) {
    return "פרטים לא תקינים.";
  }
  const issues = parsed.error.issues;
  for (const issue of issues) {
    const path = issue.path.join(".");
    if (path === "selectedShippingMethodId") {
      return "יש לבחור שיטת משלוח.";
    }
    if (path.startsWith("customer") || path === "notes") {
      return formatCheckoutValidationError(issue);
    }
    if (issue.code === "unrecognized_keys") {
      return "פרטים לא תקינים.";
    }
  }
  return "פרטים לא תקינים.";
}
