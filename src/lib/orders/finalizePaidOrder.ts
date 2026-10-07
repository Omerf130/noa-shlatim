import { connectDb } from "@/lib/db/connect";
import type { PayPlusCallbackDecision } from "@/lib/orders/decidePayPlusCallback";
import type { PaymentAttemptRecord } from "@/lib/orders/paymentAttemptStatus";
import type { PayPlusCallbackCardDetailsPersistable } from "@/lib/payplus/parseCallbackPayload";
import { Order } from "@/models/Order";

export type PersistPayPlusCallbackResult =
  | { ok: true; idempotent: boolean }
  | { ok: false; reason: "NOT_APPLIED" | "CONFLICT" };

export async function persistPayPlusCallbackDecision(
  decision: PayPlusCallbackDecision,
  completedAt: string,
  cardDetails?: PayPlusCallbackCardDetailsPersistable,
): Promise<PersistPayPlusCallbackResult> {
  if (decision.kind === "idempotent_ok") {
    return { ok: true, idempotent: true };
  }

  if (decision.kind === "conflicting_paid_success") {
    console.warn("[payplus] conflicting success callback for already-paid order", {
      orderId: decision.orderId,
      existingTransactionUid: decision.existingTransactionUid,
      incomingTransactionUid: decision.incomingTransactionUid,
    });
    return { ok: true, idempotent: true };
  }

  if (decision.kind === "reject") {
    return { ok: false, reason: "NOT_APPLIED" };
  }

  await connectDb();

  if (decision.kind === "mark_paid") {
    const existingByUid = await Order.findOne({
      "payment.attempts.payplusTransactionUid": decision.payplusTransactionUid,
    })
      .select({ _id: 1, status: 1 })
      .lean();

    if (existingByUid) {
      if (existingByUid._id.toString() === decision.orderId) {
        return { ok: true, idempotent: true };
      }
      return { ok: false, reason: "CONFLICT" };
    }

    const attemptCardSet: Record<string, unknown> = {};
    if (cardDetails?.payplusCardLastFourDigits) {
      attemptCardSet["payment.attempts.$[elem].payplusCardLastFourDigits"] =
        cardDetails.payplusCardLastFourDigits;
    }
    if (cardDetails?.payplusNumberOfPayments !== undefined) {
      attemptCardSet["payment.attempts.$[elem].payplusNumberOfPayments"] =
        cardDetails.payplusNumberOfPayments;
    }

    const updated = await Order.findOneAndUpdate(
      {
        _id: decision.orderId,
        status: "payment_pending",
        "payment.attempts": {
          $elemMatch: {
            attemptId: decision.attemptId,
            status: { $in: ["ready", "failed"] },
          },
        },
      },
      {
        $set: {
          status: "paid",
          "payment.activeAttemptId": null,
          "payment.attempts.$[elem].status": "succeeded",
          "payment.attempts.$[elem].completedAt": completedAt,
          "payment.attempts.$[elem].payplusTransactionUid": decision.payplusTransactionUid,
          "payment.attempts.$[elem].statusCode": decision.statusCode,
          ...attemptCardSet,
        },
      },
      {
        arrayFilters: [{ "elem.attemptId": decision.attemptId }],
        new: true,
      },
    );

    if (updated) {
      return { ok: true, idempotent: false };
    }

    const order = await Order.findById(decision.orderId)
      .select({ status: 1, payment: 1 })
      .lean();
    if (!order) {
      return { ok: false, reason: "NOT_APPLIED" };
    }

    const attempts = (order.payment?.attempts ?? []) as PaymentAttemptRecord[];
    const attempt = attempts.find((a) => a.attemptId === decision.attemptId);
    if (
      order.status === "paid" &&
      attempt?.payplusTransactionUid === decision.payplusTransactionUid
    ) {
      return { ok: true, idempotent: true };
    }

    return { ok: false, reason: "NOT_APPLIED" };
  }

  if (decision.kind === "mark_failed") {
    const updateFields: Record<string, unknown> = {
      "payment.attempts.$[elem].status": "failed",
      "payment.attempts.$[elem].completedAt": completedAt,
      "payment.attempts.$[elem].payplusTransactionUid": decision.payplusTransactionUid,
      "payment.attempts.$[elem].statusCode": decision.statusCode,
      "payment.attempts.$[elem].failureReason": decision.failureReason,
    };

    if (decision.clearActiveAttempt) {
      updateFields["payment.activeAttemptId"] = null;
    }

    const updated = await Order.findOneAndUpdate(
      {
        _id: decision.orderId,
        status: "payment_pending",
        "payment.attempts": {
          $elemMatch: {
            attemptId: decision.attemptId,
            status: { $in: ["pending_link", "ready", "failed", "link_failed"] },
          },
        },
      },
      { $set: updateFields },
      {
        arrayFilters: [{ "elem.attemptId": decision.attemptId }],
        new: true,
      },
    );

    if (updated) {
      return { ok: true, idempotent: false };
    }

    const order = await Order.findById(decision.orderId)
      .select({ status: 1, payment: 1 })
      .lean();
    const failedAttempts = (order?.payment?.attempts ?? []) as PaymentAttemptRecord[];
    const attempt = failedAttempts.find((a) => a.attemptId === decision.attemptId);
    if (attempt?.status === "failed" && attempt.payplusTransactionUid === decision.payplusTransactionUid) {
      return { ok: true, idempotent: true };
    }

    return { ok: false, reason: "NOT_APPLIED" };
  }

  return { ok: false, reason: "NOT_APPLIED" };
}
