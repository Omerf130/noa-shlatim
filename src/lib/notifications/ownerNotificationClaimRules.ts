import { OWNER_NOTIFICATION_PENDING_STALE_MS } from "@/lib/orders/ownerPaidNotification";

export type OwnerNotificationClaimSkipReason = "sent" | "pending_fresh" | "not_paid";

export function evaluateOwnerNotificationClaimSkip(
  orderStatus: string,
  notification: { status?: string; lastAttemptAt?: string } | null | undefined,
  nowMs: number,
): OwnerNotificationClaimSkipReason | null {
  if (orderStatus !== "paid") {
    return "not_paid";
  }

  const status = notification?.status;
  if (status === "sent") {
    return "sent";
  }

  if (status === "pending") {
    const last = notification?.lastAttemptAt?.trim();
    const staleBeforeIso = new Date(nowMs - OWNER_NOTIFICATION_PENDING_STALE_MS).toISOString();
    if (last && last > staleBeforeIso) {
      return "pending_fresh";
    }
  }

  return null;
}
