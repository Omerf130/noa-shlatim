/** Individual PayPlus payment attempt — not top-level Order status. */
export const PAYMENT_ATTEMPT_STATUSES = [
  "pending_link",
  "ready",
  "link_failed",
  "failed",
  "succeeded",
] as const;

export type PaymentAttemptStatus = (typeof PAYMENT_ATTEMPT_STATUSES)[number];

/** If generateLink hangs, init may reclaim after this window (Batch B). */
export const PENDING_LINK_STALE_MS = 120_000;

const TERMINAL_ATTEMPT_STATUSES: ReadonlySet<PaymentAttemptStatus> = new Set([
  "link_failed",
  "failed",
  "succeeded",
]);

const BLOCKING_ATTEMPT_STATUSES: ReadonlySet<PaymentAttemptStatus> = new Set([
  "pending_link",
  "ready",
]);

export function isTerminalPaymentAttemptStatus(status: PaymentAttemptStatus): boolean {
  return TERMINAL_ATTEMPT_STATUSES.has(status);
}

export function isBlockingPaymentAttemptStatus(status: PaymentAttemptStatus): boolean {
  return BLOCKING_ATTEMPT_STATUSES.has(status);
}

export function isPaymentAttemptStatus(value: string): value is PaymentAttemptStatus {
  return (PAYMENT_ATTEMPT_STATUSES as readonly string[]).includes(value);
}

export type PaymentAttemptRecord = {
  attemptId: string;
  status: PaymentAttemptStatus;
  createdAt: string;
  completedAt?: string;
  pageRequestUid?: string;
  paymentPageLink?: string;
  payplusTransactionUid?: string;
  statusCode?: string;
  failureReason?: string;
};

export function findPaymentAttemptById(
  attempts: PaymentAttemptRecord[] | undefined,
  attemptId: string | null | undefined,
): PaymentAttemptRecord | null {
  if (!attemptId || !attempts?.length) {
    return null;
  }
  return attempts.find((a) => a.attemptId === attemptId) ?? null;
}

export function isPendingLinkStale(attempt: PaymentAttemptRecord, nowMs: number): boolean {
  if (attempt.status !== "pending_link") {
    return false;
  }
  const created = Date.parse(attempt.createdAt);
  if (!Number.isFinite(created)) {
    return true;
  }
  return nowMs - created > PENDING_LINK_STALE_MS;
}

/**
 * Whether a new init may start (Batch B). Batch A defines rules only.
 */
export function isPaymentInitRetryAllowed(params: {
  orderStatus: string;
  hasCommercialSnapshot: boolean;
  activeAttempt: PaymentAttemptRecord | null;
  nowMs?: number;
}): boolean {
  const now = params.nowMs ?? Date.now();

  if (params.orderStatus === "paid" || params.orderStatus === "creating") {
    return false;
  }

  if (params.orderStatus === "draft") {
    return params.activeAttempt === null;
  }

  if (params.orderStatus !== "payment_pending") {
    return false;
  }

  if (!params.hasCommercialSnapshot) {
    return false;
  }

  if (!params.activeAttempt) {
    return true;
  }

  if (params.activeAttempt.status === "pending_link") {
    return isPendingLinkStale(params.activeAttempt, now);
  }

  if (params.activeAttempt.status === "ready") {
    return false;
  }

  return isTerminalPaymentAttemptStatus(params.activeAttempt.status);
}
