import type { ShippingAddress } from "@/lib/checkout/shippingAddressSchema";
import { parseShippingAddress } from "@/lib/checkout/shippingAddressSchema";

export function formatShippingAddressBlock(address: ShippingAddress): string {
  const floorPart = address.floor ? `, קומה ${address.floor}` : "";
  return `${address.street} ${address.houseNumber}${floorPart}\n${address.city} ${address.postalCode}`;
}

export function formatShippingAddressSingleLine(address: ShippingAddress): string {
  return formatShippingAddressBlock(address).replace("\n", ", ");
}

export function parsePersistedShippingAddress(
  raw: unknown,
): ShippingAddress | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return parseShippingAddress(raw);
}
