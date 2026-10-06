import type { AdminOrderStatusKey } from "@/lib/admin/orders/adminOrderDtos";

export type DashboardDateParts = {
  dateLine: string;
  timeLine: string;
};

export type DashboardPaymentStatusPresentation = {
  key: "paid" | "payment_pending" | "draft" | "creating" | "other";
  label: string;
  showCheck: boolean;
  showClock: boolean;
};

export type DashboardWorkflowStatusPresentation = {
  label: string;
  tone: "blue" | "tan" | "purple" | "neutral" | "amber";
};

export function formatDashboardOrderDateParts(
  value: Date | string | undefined,
): DashboardDateParts {
  if (!value) {
    return { dateLine: "—", timeLine: "—" };
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { dateLine: "—", timeLine: "—" };
  }
  const dateLine = new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  const timeLine = new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return { dateLine, timeLine };
}

export function formatDashboardAttentionDate(
  value: Date | string | undefined,
): string {
  if (!value) {
    return "—";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Payment column — reflects persisted order.status (PayPlus lifecycle).
 */
export function adminDashboardPaymentStatus(
  status: AdminOrderStatusKey | string,
): DashboardPaymentStatusPresentation {
  switch (status) {
    case "paid":
      return { key: "paid", label: "שולם", showCheck: true, showClock: false };
    case "payment_pending":
      return { key: "payment_pending", label: "ממתין", showCheck: false, showClock: true };
    case "draft":
      return { key: "draft", label: "טיוטה", showCheck: false, showClock: false };
    case "creating":
      return { key: "creating", label: "בהכנה", showCheck: false, showClock: false };
    default:
      return { key: "other", label: "—", showCheck: false, showClock: false };
  }
}

/**
 * Order workflow column — placeholder until fulfillment exists.
 * Maps persisted status to dashboard-friendly workflow labels only.
 */
export function adminDashboardWorkflowStatus(
  status: AdminOrderStatusKey | string,
): DashboardWorkflowStatusPresentation {
  switch (status) {
    case "paid":
      return { label: "חדשה", tone: "blue" };
    case "payment_pending":
      return { label: "ממתינה לתשלום", tone: "amber" };
    case "creating":
      return { label: "בהכנה", tone: "tan" };
    case "draft":
      return { label: "טיוטה", tone: "neutral" };
    default:
      return { label: "—", tone: "neutral" };
  }
}
