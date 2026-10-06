import { checkoutCustomerSchema } from "@/lib/checkout/customerSchema";

export function validatePersistedCheckoutCustomer(customer: {
  fullName?: string;
  phone?: string;
  email?: string;
} | null | undefined): boolean {
  if (!customer) {
    return false;
  }
  const parsed = checkoutCustomerSchema.safeParse({
    customer: {
      fullName: customer.fullName ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
    },
    notes: "",
  });
  return parsed.success;
}
