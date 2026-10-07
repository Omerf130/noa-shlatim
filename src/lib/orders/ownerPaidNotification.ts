export const OWNER_PAID_NOTIFICATION_STATUSES = [
  "pending",
  "sent",
  "failed",
] as const;

export type OwnerPaidNotificationStatus =
  (typeof OWNER_PAID_NOTIFICATION_STATUSES)[number];

export type OrderOwnerPaidNotification = {
  status: OwnerPaidNotificationStatus;
  sentAt?: string;
  lastAttemptAt?: string;
  attemptCount?: number;
  errorMessage?: string;
};

/** Fresh pending claims younger than this are not re-claimed. */
export const OWNER_NOTIFICATION_PENDING_STALE_MS = 5 * 60 * 1000;

export const OWNER_PAID_ORDER_EMAIL_FROM =
  "נועה | שלטים לדלת <orders@noa-sign.co.il>";

export const OWNER_PAID_ORDER_EMAIL_SUBJECT = "הזמנה חדשה התקבלה באתר 🎉";
