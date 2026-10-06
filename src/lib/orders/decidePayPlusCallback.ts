import { orderCommercialSnapshotSchema } from "@/lib/orders/commercialSnapshot";
import {
  findPaymentAttemptById,
  type PaymentAttemptRecord,
} from "@/lib/orders/paymentAttemptStatus";
import type { OrderForPayPlusCallback } from "@/lib/orders/payPlusCallbackTypes";
import { assertValidOrderId } from "@/lib/orders/orderBlobPaths";
import { PAYPLUS_SUCCESS_STATUS_CODE } from "@/lib/payplus/constants";
import type { PayPlusCallbackPayload } from "@/lib/payplus/parseCallbackPayload";
import { payPlusAmountToOrderMinor } from "@/lib/payplus/amount";

export type PayPlusCallbackRejectReason =
  | "INVALID_ORDER_ID"
  | "ORDER_NOT_FOUND"
  | "ORDER_NOT_PAYABLE"
  | "MISSING_SNAPSHOT"
  | "INVALID_SNAPSHOT"
  | "MISSING_ATTEMPT_ID"
  | "ATTEMPT_NOT_FOUND"
  | "CORRELATION_ORDER_ID"
  | "CORRELATION_PAGE_REQUEST_UID"
  | "AMOUNT_MISMATCH"
  | "CURRENCY_MISMATCH"
  | "MISSING_TRANSACTION_UID"
  | "UNSUPPORTED_TRANSACTION_TYPE"
  | "ATTEMPT_ALREADY_SUCCEEDED_DIFFERENT_TX";

export type PayPlusCallbackDecision =
  | { kind: "reject"; reason: PayPlusCallbackRejectReason }
  | { kind: "idempotent_ok" }
  | {
      kind: "conflicting_paid_success";
      orderId: string;
      existingTransactionUid: string;
      incomingTransactionUid: string;
    }
  | {
      kind: "mark_paid";
      orderId: string;
      attemptId: string;
      payplusTransactionUid: string;
      statusCode: string;
    }
  | {
      kind: "mark_failed";
      orderId: string;
      attemptId: string;
      payplusTransactionUid: string;
      statusCode: string;
      failureReason: string;
      clearActiveAttempt: boolean;
    };

const SUCCESS_ELIGIBLE_ATTEMPT_STATUSES = new Set([
  "ready",
  "failed",
] as const);

function findAttemptByTransactionUid(
  attempts: PaymentAttemptRecord[] | undefined,
  transactionUid: string,
): PaymentAttemptRecord | null {
  if (!attempts?.length) {
    return null;
  }
  return attempts.find((a) => a.payplusTransactionUid === transactionUid) ?? null;
}

function validateAmountAndCurrency(
  order: OrderForPayPlusCallback,
  amount: number,
  currency: string,
): PayPlusCallbackDecision | null {
  const snapshotParsed = orderCommercialSnapshotSchema.safeParse(order.commercialSnapshot);
  if (!snapshotParsed.success) {
    return { kind: "reject", reason: "INVALID_SNAPSHOT" };
  }
  const snapshot = snapshotParsed.data;

  if (currency !== snapshot.currency) {
    return { kind: "reject", reason: "CURRENCY_MISMATCH" };
  }

  const minor = payPlusAmountToOrderMinor(amount);
  if (!minor.ok || minor.minor !== snapshot.totalAmountMinor) {
    return { kind: "reject", reason: "AMOUNT_MISMATCH" };
  }

  return null;
}

function validateCorrelation(
  order: OrderForPayPlusCallback,
  payload: PayPlusCallbackPayload,
  attempt: PaymentAttemptRecord,
): PayPlusCallbackDecision | null {
  const orderIdFromPayload = payload.transaction.more_info?.trim();
  const attemptIdFromPayload = payload.transaction.more_info_2?.trim();

  if (!orderIdFromPayload || orderIdFromPayload !== order.orderId) {
    return { kind: "reject", reason: "CORRELATION_ORDER_ID" };
  }

  if (!attemptIdFromPayload || attemptIdFromPayload !== attempt.attemptId) {
    return { kind: "reject", reason: "MISSING_ATTEMPT_ID" };
  }

  const paymentRequestUid = payload.transaction.payment_request_uid?.trim();
  const storedPageUid = attempt.pageRequestUid?.trim();
  if (storedPageUid && paymentRequestUid && storedPageUid !== paymentRequestUid) {
    return { kind: "reject", reason: "CORRELATION_PAGE_REQUEST_UID" };
  }

  return null;
}

/**
 * Pure decision engine for a verified PayPlus callback against a loaded Order.
 */
export function decidePayPlusCallback(
  order: OrderForPayPlusCallback | null,
  payload: PayPlusCallbackPayload,
): PayPlusCallbackDecision {
  const tx = payload.transaction;
  const transactionUid = tx.uid.trim();
  if (!transactionUid) {
    return { kind: "reject", reason: "MISSING_TRANSACTION_UID" };
  }

  if (payload.transactionType && payload.transactionType !== "Charge") {
    return { kind: "reject", reason: "UNSUPPORTED_TRANSACTION_TYPE" };
  }

  const orderIdFromPayload = tx.more_info?.trim();
  if (!orderIdFromPayload) {
    return { kind: "reject", reason: "CORRELATION_ORDER_ID" };
  }

  try {
    assertValidOrderId(orderIdFromPayload);
  } catch {
    return { kind: "reject", reason: "INVALID_ORDER_ID" };
  }

  if (!order) {
    return { kind: "reject", reason: "ORDER_NOT_FOUND" };
  }

  if (order.orderId !== orderIdFromPayload) {
    return { kind: "reject", reason: "CORRELATION_ORDER_ID" };
  }

  const attempts = order.payment?.attempts ?? [];
  const byTx = findAttemptByTransactionUid(attempts, transactionUid);
  if (byTx) {
    if (byTx.status === "succeeded") {
      return { kind: "idempotent_ok" };
    }
  }

  const attemptIdFromPayload = tx.more_info_2?.trim();
  if (!attemptIdFromPayload) {
    return { kind: "reject", reason: "MISSING_ATTEMPT_ID" };
  }

  const attempt = findPaymentAttemptById(attempts, attemptIdFromPayload);
  if (!attempt) {
    return { kind: "reject", reason: "ATTEMPT_NOT_FOUND" };
  }

  if (attempt.payplusTransactionUid && attempt.payplusTransactionUid !== transactionUid) {
    if (order.status === "paid" && tx.status_code === PAYPLUS_SUCCESS_STATUS_CODE) {
      return {
        kind: "conflicting_paid_success",
        orderId: order.orderId,
        existingTransactionUid: attempt.payplusTransactionUid,
        incomingTransactionUid: transactionUid,
      };
    }
    return { kind: "reject", reason: "ATTEMPT_ALREADY_SUCCEEDED_DIFFERENT_TX" };
  }

  const correlationError = validateCorrelation(order, payload, attempt);
  if (correlationError) {
    return correlationError;
  }

  const amountError = validateAmountAndCurrency(order, tx.amount, tx.currency);
  if (amountError) {
    return amountError;
  }

  const isSuccess = tx.status_code === PAYPLUS_SUCCESS_STATUS_CODE;

  if (order.status === "paid") {
    const succeededAttempt = attempts.find(
      (a) => a.payplusTransactionUid === transactionUid && a.status === "succeeded",
    );
    if (succeededAttempt) {
      return { kind: "idempotent_ok" };
    }
    if (isSuccess) {
      const paidTxUid =
        attempts.find((a) => a.status === "succeeded")?.payplusTransactionUid ?? "unknown";
      return {
        kind: "conflicting_paid_success",
        orderId: order.orderId,
        existingTransactionUid: paidTxUid,
        incomingTransactionUid: transactionUid,
      };
    }
    return { kind: "idempotent_ok" };
  }

  if (order.status !== "payment_pending") {
    return { kind: "reject", reason: "ORDER_NOT_PAYABLE" };
  }

  if (!order.commercialSnapshot) {
    return { kind: "reject", reason: "MISSING_SNAPSHOT" };
  }

  if (isSuccess) {
    if (attempt.status === "succeeded") {
      return { kind: "idempotent_ok" };
    }
    if (!SUCCESS_ELIGIBLE_ATTEMPT_STATUSES.has(attempt.status as "ready" | "failed")) {
      return { kind: "reject", reason: "ATTEMPT_NOT_FOUND" };
    }

    return {
      kind: "mark_paid",
      orderId: order.orderId,
      attemptId: attempt.attemptId,
      payplusTransactionUid: transactionUid,
      statusCode: tx.status_code,
    };
  }

  if (attempt.status === "succeeded") {
    return { kind: "idempotent_ok" };
  }

  const clearActive = order.payment?.activeAttemptId === attempt.attemptId;

  return {
    kind: "mark_failed",
    orderId: order.orderId,
    attemptId: attempt.attemptId,
    payplusTransactionUid: transactionUid,
    statusCode: tx.status_code,
    failureReason: `PAYPLUS_STATUS_${tx.status_code}`,
    clearActiveAttempt: clearActive,
  };
}

/** Apply a decision to an in-memory order fixture (tests only). */
export function applyPayPlusCallbackDecisionToFixture(
  order: OrderForPayPlusCallback,
  decision: PayPlusCallbackDecision,
  completedAt: string,
): OrderForPayPlusCallback {
  if (decision.kind === "mark_paid") {
    const attempts = order.payment?.attempts ?? [];
    return {
      ...order,
      status: "paid",
      payment: {
        activeAttemptId: null,
        attempts: attempts.map((a) =>
          a.attemptId === decision.attemptId
            ? {
                ...a,
                status: "succeeded",
                completedAt,
                payplusTransactionUid: decision.payplusTransactionUid,
                statusCode: decision.statusCode,
              }
            : a,
        ),
      },
    };
  }

  if (decision.kind === "mark_failed") {
    const attempts = order.payment?.attempts ?? [];
    return {
      ...order,
      payment: {
        activeAttemptId: decision.clearActiveAttempt ? null : order.payment?.activeAttemptId,
        attempts: attempts.map((a) =>
          a.attemptId === decision.attemptId
            ? {
                ...a,
                status: "failed",
                completedAt,
                payplusTransactionUid: decision.payplusTransactionUid,
                statusCode: decision.statusCode,
                failureReason: decision.failureReason,
              }
            : a,
        ),
      },
    };
  }

  return order;
}
