import { z } from "zod";

const locationNameSchema = z
  .string()
  .trim()
  .min(2, "min")
  .max(80, "max")
  .refine((v) => /^[\p{L}\p{M}\d\s'’.\-./]+$/u.test(v), "invalid");

const streetSchema = z
  .string()
  .trim()
  .min(2, "min")
  .max(120, "max")
  .refine((v) => /^[\p{L}\p{M}\d\s'’.\-./]+$/u.test(v), "invalid");

const houseNumberSchema = z
  .string()
  .trim()
  .min(1, "required")
  .max(20, "max")
  .refine((v) => /^[\p{L}\p{M}\d\s\-/.]+$/u.test(v), "invalid");

const postalCodeSchema = z
  .string()
  .trim()
  .refine((v) => /^\d{7}$/.test(v), "postal");

export const shippingAddressSchema = z.object({
  city: locationNameSchema,
  street: streetSchema,
  houseNumber: houseNumberSchema,
  floor: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(10, "max").optional(),
  ),
  postalCode: postalCodeSchema,
});

export type ShippingAddress = z.infer<typeof shippingAddressSchema>;

export type ShippingAddressInput = {
  city: string;
  street: string;
  houseNumber: string;
  floor?: string;
  postalCode: string;
};

export function parseShippingAddress(raw: unknown): ShippingAddress | null {
  const parsed = shippingAddressSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function formatShippingAddressValidationError(issue: z.ZodIssue): string {
  const path = issue.path.join(".");
  if (path === "shippingAddress.city" || path.endsWith(".city")) {
    if (issue.message === "min") {
      return "נא להזין עיר (לפחות 2 תווים).";
    }
    if (issue.message === "max") {
      return "שם העיר ארוך מדי.";
    }
    return "נא להזין עיר תקינה.";
  }
  if (path === "shippingAddress.street" || path.endsWith(".street")) {
    if (issue.message === "min") {
      return "נא להזין רחוב (לפחות 2 תווים).";
    }
    if (issue.message === "max") {
      return "שם הרחוב ארוך מדי.";
    }
    return "נא להזין רחוב תקין.";
  }
  if (path === "shippingAddress.houseNumber" || path.endsWith(".houseNumber")) {
    if (issue.message === "max") {
      return "מספר הבית ארוך מדי.";
    }
    return "נא להזין מספר בית.";
  }
  if (path === "shippingAddress.floor" || path.endsWith(".floor")) {
    return "קומה ארוכה מדי (מקסימום 10 תווים).";
  }
  if (path === "shippingAddress.postalCode" || path.endsWith(".postalCode")) {
    return "נא להזין מיקוד בן 7 ספרות.";
  }
  return "כתובת למשלוח לא תקינה.";
}

export type ShippingAddressFieldKey =
  | "city"
  | "street"
  | "houseNumber"
  | "floor"
  | "postalCode";

export type ShippingAddressFieldErrors = Partial<
  Record<ShippingAddressFieldKey, string>
>;

/** Client-side validation with Hebrew field messages (mirrors server rules). */
export function validateShippingAddressFields(
  input: ShippingAddressInput,
): ShippingAddressFieldErrors {
  const parsed = shippingAddressSchema.safeParse(input);
  if (parsed.success) {
    return {};
  }
  const errors: ShippingAddressFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (
      key === "city" ||
      key === "street" ||
      key === "houseNumber" ||
      key === "floor" ||
      key === "postalCode"
    ) {
      if (!errors[key]) {
        errors[key] = formatShippingAddressValidationError({
          ...issue,
          path: ["shippingAddress", ...issue.path],
        });
      }
    }
  }
  return errors;
}

export function isCompleteShippingAddress(
  input: ShippingAddressInput | null | undefined,
): input is ShippingAddress {
  return parseShippingAddress(input) !== null;
}
