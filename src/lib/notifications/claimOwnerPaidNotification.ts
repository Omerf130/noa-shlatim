import { connectDb } from "@/lib/db/connect";
import { evaluateOwnerNotificationClaimSkip } from "@/lib/notifications/ownerNotificationClaimRules";
import { OWNER_NOTIFICATION_PENDING_STALE_MS } from "@/lib/orders/ownerPaidNotification";
import { Order } from "@/models/Order";

export type ClaimOwnerPaidNotificationResult =
  | { ok: true; claimed: true; attemptCount: number }
  | {
      ok: true;
      claimed: false;
      reason: "sent" | "pending_fresh" | "not_paid" | "not_found";
    }
  | { ok: false; reason: "db_error" };

export async function claimOwnerPaidNotification(params: {
  orderId: string;
  nowMs?: number;
}): Promise<ClaimOwnerPaidNotificationResult> {
  const nowMs = params.nowMs ?? Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const staleBeforeIso = new Date(nowMs - OWNER_NOTIFICATION_PENDING_STALE_MS).toISOString();

  await connectDb();

  const existing = await Order.findById(params.orderId)
    .select({ status: 1, ownerPaidNotification: 1 })
    .lean();

  if (!existing) {
    return { ok: true, claimed: false, reason: "not_found" };
  }

  const notification = existing.ownerPaidNotification as
    | { status?: string; lastAttemptAt?: string }
    | undefined;

  const skip = evaluateOwnerNotificationClaimSkip(existing.status, notification, nowMs);
  if (skip === "not_paid") {
    return { ok: true, claimed: false, reason: "not_paid" };
  }
  if (skip === "sent") {
    return { ok: true, claimed: false, reason: "sent" };
  }
  if (skip === "pending_fresh") {
    return { ok: true, claimed: false, reason: "pending_fresh" };
  }

  const updated = await Order.findOneAndUpdate(
    {
      _id: params.orderId,
      status: "paid",
      $or: [
        { ownerPaidNotification: { $exists: false } },
        { "ownerPaidNotification.status": { $exists: false } },
        { "ownerPaidNotification.status": "failed" },
        {
          "ownerPaidNotification.status": "pending",
          "ownerPaidNotification.lastAttemptAt": { $lte: staleBeforeIso },
        },
      ],
    },
    {
      $set: {
        "ownerPaidNotification.status": "pending",
        "ownerPaidNotification.lastAttemptAt": nowIso,
      },
      $inc: { "ownerPaidNotification.attemptCount": 1 },
      $unset: { "ownerPaidNotification.errorMessage": "" },
    },
    { new: true, upsert: false },
  ).lean();

  if (!updated) {
    const refreshed = await Order.findById(params.orderId)
      .select({ status: 1, ownerPaidNotification: 1 })
      .lean();
    const refreshedNotification = refreshed?.ownerPaidNotification as
      | { status?: string; lastAttemptAt?: string }
      | undefined;
    if (refreshedNotification?.status === "sent") {
      return { ok: true, claimed: false, reason: "sent" };
    }
    return { ok: true, claimed: false, reason: "pending_fresh" };
  }

  const attemptCount =
    (updated.ownerPaidNotification as { attemptCount?: number } | undefined)?.attemptCount ?? 1;

  return { ok: true, claimed: true, attemptCount };
}

export async function markOwnerPaidNotificationSent(params: {
  orderId: string;
  sentAtIso: string;
}): Promise<void> {
  await connectDb();
  await Order.updateOne(
    {
      _id: params.orderId,
      status: "paid",
      "ownerPaidNotification.status": "pending",
    },
    {
      $set: {
        "ownerPaidNotification.status": "sent",
        "ownerPaidNotification.sentAt": params.sentAtIso,
      },
      $unset: { "ownerPaidNotification.errorMessage": "" },
    },
  );
}

export async function markOwnerPaidNotificationFailed(params: {
  orderId: string;
  errorMessage: string;
}): Promise<void> {
  await connectDb();
  await Order.updateOne(
    {
      _id: params.orderId,
      status: "paid",
      "ownerPaidNotification.status": "pending",
    },
    {
      $set: {
        "ownerPaidNotification.status": "failed",
        "ownerPaidNotification.errorMessage": params.errorMessage,
      },
    },
  );
}

/** Mark failed when claim never happened (e.g. missing config before claim). */
export async function markOwnerPaidNotificationFailedWithoutClaim(params: {
  orderId: string;
  errorMessage: string;
}): Promise<void> {
  await connectDb();
  await Order.updateOne(
    {
      _id: params.orderId,
      status: "paid",
      $or: [
        { ownerPaidNotification: { $exists: false } },
        { "ownerPaidNotification.status": { $ne: "sent" } },
      ],
    },
    {
      $set: {
        "ownerPaidNotification.status": "failed",
        "ownerPaidNotification.errorMessage": params.errorMessage,
        "ownerPaidNotification.lastAttemptAt": new Date().toISOString(),
      },
    },
  );
}
