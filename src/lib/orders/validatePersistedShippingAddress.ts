import { parseShippingAddress } from "@/lib/checkout/shippingAddressSchema";

export function validatePersistedShippingAddress(
  shippingAddress: unknown,
): boolean {
  return parseShippingAddress(shippingAddress) !== null;
}
