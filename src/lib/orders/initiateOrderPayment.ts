import { connectDb } from "@/lib/db/connect";
import {
  hasValidCommercialSnapshot,
  parseOrderCommercialSnapshot,
} from "@/lib/orders/commercialSnapshotAccess";
import { computeLiveCommercialSnapshotV2ForOrder } from "@/lib/orders/computeLiveCommercialForOrder";
import type { OrderCommercialSnapshotV2 } from "@/lib/orders/commercialSnapshotV2";
import { OrderError } from "@/lib/orders/errors";
import {
  findPaymentAttemptById,
  isPaymentInitRetryAllowed,
  isPendingLinkStale,
  type PaymentAttemptRecord,
} from "@/lib/orders/paymentAttemptStatus";
import { validatePersistedCheckoutCustomer } from "@/lib/orders/validatePersistedCheckoutCustomer";
import { buildPayPlusGenerateLinkRequest } from "@/lib/payplus/buildGenerateLinkRequest";
import { getPayPlusConfig } from "@/lib/payplus/env";
import {
  generatePayPlusPaymentLink,
  type PayPlusFetchFn,
} from "@/lib/payplus/generatePaymentLink";
import { TERMS_VERSION } from "@/lib/legal/terms";
import type { OrderTermsAcceptance } from "@/lib/orders/termsAcceptance";
import { Order } from "@/models/Order";
import type { OrderLikeForResolveItems } from "@/lib/orders/resolveOrderItems";
import { randomUUID } from "node:crypto";

export type OrderLeanForPayment = {
  status: string;
  design?: unknown;
  creationMode?: string;
  assets?: unknown;
  items?: unknown;
  customer?: { fullName?: string; phone?: string; email?: string };
  checkoutSelection?: { shippingMethodId?: string };
  commercialSnapshot?: unknown;
  termsAcceptance?: OrderTermsAcceptance | null;
  payment?: {
    activeAttemptId?: string | null;
    attempts?: PaymentAttemptRecord[];
  } | null;
};

function activeAttemptRecord(order: OrderLeanForPayment): PaymentAttemptRecord | null {
  return findPaymentAttemptById(
    order.payment?.attempts,
    order.payment?.activeAttemptId ?? null,
  );
}

function hasCommercialSnapshot(order: OrderLeanForPayment): boolean {
  return hasValidCommercialSnapshot(order.commercialSnapshot);
}

function orderLikeForCommercial(order: OrderLeanForPayment): OrderLikeForResolveItems {
  return {
    creationMode: order.creationMode as OrderLikeForResolveItems["creationMode"],
    design: order.design,
    assets: order.assets as OrderLikeForResolveItems["assets"],
    items: order.items as OrderLikeForResolveItems["items"],
  };
}

async function reclaimStalePendingLink(orderId: string, nowMs: number): Promise<void> {
  const order = await Order.findById(orderId).lean();
  if (!order) {
    return;
  }
  const active = activeAttemptRecord(order as OrderLeanForPayment);
  if (!active || active.status !== "pending_link") {
    return;
  }
  if (!isPendingLinkStale(active, nowMs)) {
    return;
  }

  const completedAt = new Date(nowMs).toISOString();
  await Order.updateOne(
    {
      _id: orderId,
      "payment.activeAttemptId": active.attemptId,
      "payment.attempts": {
        $elemMatch: { attemptId: active.attemptId, status: "pending_link" },
      },
    },
    {
      $set: {
        "payment.activeAttemptId": null,
        "payment.attempts.$[elem].status": "link_failed",
        "payment.attempts.$[elem].completedAt": completedAt,
        "payment.attempts.$[elem].failureReason": "LINK_STALE",
      },
    },
    {
      arrayFilters: [{ "elem.attemptId": active.attemptId }],
    },
  );
}

function buildTermsAcceptance(nowIso: string): OrderTermsAcceptance {
  return {
    termsAccepted: true,
    termsVersion: TERMS_VERSION,
    termsAcceptedAt: nowIso,
  };
}

async function reserveFirstPaymentAttempt(params: {
  orderId: string;
  attemptId: string;
  createdAt: string;
  snapshot: OrderCommercialSnapshotV2;
  termsAcceptance: OrderTermsAcceptance;
}): Promise<boolean> {
  const updated = await Order.findOneAndUpdate(
    {
      _id: params.orderId,
      status: "draft",
      $and: [
        {
          $or: [
            { commercialSnapshot: { $exists: false } },
            { commercialSnapshot: null },
          ],
        },
        {
          $or: [
            { "payment.activeAttemptId": { $exists: false } },
            { "payment.activeAttemptId": null },
          ],
        },
      ],
    },
    {
      $set: {
        status: "payment_pending",
        commercialSnapshot: params.snapshot,
        termsAcceptance: params.termsAcceptance,
        "payment.activeAttemptId": params.attemptId,
      },
      $push: {
        "payment.attempts": {
          attemptId: params.attemptId,
          status: "pending_link",
          createdAt: params.createdAt,
        },
      },
    },
    { new: true },
  ).lean();

  return Boolean(updated);
}

async function reserveRetryPaymentAttempt(params: {
  orderId: string;
  attemptId: string;
  createdAt: string;
}): Promise<boolean> {
  const updated = await Order.findOneAndUpdate(
    {
      _id: params.orderId,
      status: "payment_pending",
      commercialSnapshot: { $exists: true, $ne: null },
      $or: [
        { "payment.activeAttemptId": { $exists: false } },
        { "payment.activeAttemptId": null },
      ],
    },
    {
      $set: {
        "payment.activeAttemptId": params.attemptId,
      },
      $push: {
        "payment.attempts": {
          attemptId: params.attemptId,
          status: "pending_link",
          createdAt: params.createdAt,
        },
      },
    },
    { new: true },
  ).lean();

  return Boolean(updated);
}

async function markAttemptLinkReady(params: {
  orderId: string;
  attemptId: string;
  pageRequestUid: string;
  paymentPageLink: string;
}): Promise<void> {
  await Order.updateOne(
    {
      _id: params.orderId,
      "payment.activeAttemptId": params.attemptId,
      "payment.attempts": {
        $elemMatch: { attemptId: params.attemptId, status: "pending_link" },
      },
    },
    {
      $set: {
        "payment.attempts.$[elem].status": "ready",
        "payment.attempts.$[elem].pageRequestUid": params.pageRequestUid,
        "payment.attempts.$[elem].paymentPageLink": params.paymentPageLink,
      },
    },
    { arrayFilters: [{ "elem.attemptId": params.attemptId }] },
  );
}

async function markAttemptLinkFailed(params: {
  orderId: string;
  attemptId: string;
  failureReason: string;
  completedAt: string;
}): Promise<void> {
  await Order.updateOne(
    {
      _id: params.orderId,
      "payment.activeAttemptId": params.attemptId,
    },
    {
      $set: {
        "payment.activeAttemptId": null,
        "payment.attempts.$[elem].status": "link_failed",
        "payment.attempts.$[elem].completedAt": params.completedAt,
        "payment.attempts.$[elem].failureReason": params.failureReason,
      },
    },
    { arrayFilters: [{ "elem.attemptId": params.attemptId }] },
  );
}

export type InitiateOrderPaymentResult =
  | { ok: true; paymentPageLink: string }
  | { ok: false; error: OrderError };

export async function initiateOrderPayment(params: {
  orderId: string;
  order: OrderLeanForPayment;
  fetchFn?: PayPlusFetchFn;
  acknowledgedTotalAmountMinor?: number | null;
}): Promise<InitiateOrderPaymentResult> {
  const orderId = params.orderId;
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  if (params.order.status === "paid" || params.order.status === "creating") {
    return {
      ok: false,
      error: new OrderError("PAYMENT_INVALID_STATE", "Invalid state", 409),
    };
  }

  if (!validatePersistedCheckoutCustomer(params.order.customer)) {
    return {
      ok: false,
      error: new OrderError("PAYMENT_NOT_READY", "Not ready", 400),
    };
  }

  const shippingMethodId = params.order.checkoutSelection?.shippingMethodId?.trim();
  if (!shippingMethodId) {
    return {
      ok: false,
      error: new OrderError("PAYMENT_NOT_READY", "Not ready", 400),
    };
  }

  await connectDb();
  await reclaimStalePendingLink(orderId, nowMs);

  const refreshed = await Order.findById(orderId).lean();
  if (!refreshed) {
    return {
      ok: false,
      error: new OrderError("ORDER_PERSIST_FAILED", "Not found", 404),
    };
  }

  const refreshedOrder = refreshed as OrderLeanForPayment;
  const active = activeAttemptRecord(refreshedOrder);
  if (
    !isPaymentInitRetryAllowed({
      orderStatus: refreshedOrder.status,
      hasCommercialSnapshot: hasCommercialSnapshot(refreshedOrder),
      activeAttempt: active,
      nowMs,
    })
  ) {
    return {
      ok: false,
      error: new OrderError("PAYMENT_IN_PROGRESS", "In progress", 409),
    };
  }

  const attemptId = randomUUID();
  let snapshotForPayment: unknown;
  let termsAcceptance: OrderTermsAcceptance;

  if (refreshedOrder.status === "draft") {
    const computed = await computeLiveCommercialSnapshotV2ForOrder({
      order: orderLikeForCommercial(refreshedOrder),
      shippingMethodId,
      capturedAt: nowIso,
    });
    if (!computed.ok) {
      return {
        ok: false,
        error: new OrderError("PAYMENT_NOT_READY", "Not ready", 400),
      };
    }
    const acknowledged = params.acknowledgedTotalAmountMinor;
    if (
      acknowledged != null &&
      acknowledged !== computed.snapshot.totalAmountMinor
    ) {
      return {
        ok: false,
        error: new OrderError(
          "COMMERCIAL_TOTAL_CHANGED",
          "Total changed",
          409,
        ),
      };
    }
    snapshotForPayment = computed.snapshot;
    termsAcceptance = buildTermsAcceptance(nowIso);

    const reserved = await reserveFirstPaymentAttempt({
      orderId,
      attemptId,
      createdAt: nowIso,
      snapshot: computed.snapshot,
      termsAcceptance,
    });
    if (!reserved) {
      return {
        ok: false,
        error: new OrderError("PAYMENT_IN_PROGRESS", "In progress", 409),
      };
    }
  } else if (
    refreshedOrder.status === "payment_pending" &&
    hasCommercialSnapshot(refreshedOrder)
  ) {
    const parsed = parseOrderCommercialSnapshot(refreshedOrder.commercialSnapshot);
    if (!parsed) {
      return {
        ok: false,
        error: new OrderError("PAYMENT_INVALID_STATE", "Invalid state", 409),
      };
    }
    snapshotForPayment = refreshedOrder.commercialSnapshot;
    if (!refreshedOrder.termsAcceptance?.termsAccepted) {
      return {
        ok: false,
        error: new OrderError("PAYMENT_INVALID_STATE", "Invalid state", 409),
      };
    }
    termsAcceptance = refreshedOrder.termsAcceptance;

    const reserved = await reserveRetryPaymentAttempt({
      orderId,
      attemptId,
      createdAt: nowIso,
    });
    if (!reserved) {
      return {
        ok: false,
        error: new OrderError("PAYMENT_IN_PROGRESS", "In progress", 409),
      };
    }
  } else {
    return {
      ok: false,
      error: new OrderError("PAYMENT_INVALID_STATE", "Invalid state", 409),
    };
  }

  const payplusConfig = getPayPlusConfig();
  if (!payplusConfig) {
    await markAttemptLinkFailed({
      orderId,
      attemptId,
      failureReason: "PAYPLUS_NOT_CONFIGURED",
      completedAt: new Date().toISOString(),
    });
    return {
      ok: false,
      error: new OrderError("ORDER_PERSIST_FAILED", "Unavailable", 503),
    };
  }

  const customerName = refreshedOrder.customer!.fullName!.trim();
  const customerEmail = refreshedOrder.customer!.email!.trim();
  const customerPhone = refreshedOrder.customer!.phone?.trim();

  const linkBody = buildPayPlusGenerateLinkRequest({
    paymentPageUid: payplusConfig.paymentPageUid,
    siteUrl: payplusConfig.siteUrl,
    orderId,
    attemptId,
    snapshot: snapshotForPayment,
    customer: {
      customer_name: customerName,
      email: customerEmail,
      ...(customerPhone ? { phone: customerPhone } : {}),
    },
  });

  const linkResult = await generatePayPlusPaymentLink({
    config: payplusConfig,
    body: linkBody,
    fetchFn: params.fetchFn,
  });

  if (!linkResult.ok) {
    const reason =
      linkResult.reason === "TIMEOUT"
        ? "PAYPLUS_TIMEOUT"
        : linkResult.reason === "HTTP"
          ? "PAYPLUS_HTTP"
          : "PAYPLUS_PARSE";
    await markAttemptLinkFailed({
      orderId,
      attemptId,
      failureReason: reason,
      completedAt: new Date().toISOString(),
    });
    return {
      ok: false,
      error: new OrderError("PAYPLUS_LINK_FAILED", "PayPlus failed", 502),
    };
  }

  await markAttemptLinkReady({
    orderId,
    attemptId,
    pageRequestUid: linkResult.pageRequestUid,
    paymentPageLink: linkResult.paymentPageLink,
  });

  return { ok: true, paymentPageLink: linkResult.paymentPageLink };
}
