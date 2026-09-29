export function formatOrderReference(orderId: string): string {
  if (orderId.length >= 8) {
    return `#${orderId.slice(-8).toUpperCase()}`;
  }
  return `#${orderId.toUpperCase()}`;
}

export function formatAdminDateTime(value: Date | string | undefined): string {
  if (!value) {
    return "—";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function materialLabelFromSnapshot(
  material: "wood" | "magnet" | undefined | null,
): string {
  if (material === "wood") return "עץ";
  if (material === "magnet") return "מגנט";
  return "—";
}

export const CUSTOMER_DETAILS_MISSING = "טרם הוזנו פרטי לקוח";

export function customerDisplayName(customer?: {
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
} | null): string {
  const name = customer?.fullName?.trim();
  if (name) {
    return name;
  }
  return CUSTOMER_DETAILS_MISSING;
}
