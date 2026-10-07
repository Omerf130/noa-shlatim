import { decidePayPlusCallback } from "@/lib/orders/decidePayPlusCallback";
import { persistPayPlusCallbackDecision } from "@/lib/orders/finalizePaidOrder";
import type { OrderForPayPlusCallback } from "@/lib/orders/payPlusCallbackTypes";
import { orderCommercialSnapshotSchema } from "@/lib/orders/commercialSnapshot";
import type { PayPlusCallbackPayload } from "@/lib/payplus/parseCallbackPayload";
import { connectDb } from "@/lib/db/connect";
import { Order } from "@/models/Order";

export type HandlePayPlusCallbackResult =
  | {
      ok: true;
      httpStatus: 200;
      idempotent: boolean;
      orderId: string;
      triggerFinbotIssuance: boolean;
    }
  | { ok: false; httpStatus: 400; reason: string };

function toOrderForCallback(
  orderId: string,
  doc: {
    status: string;
    commercialSnapshot?: unknown;
    payment?: OrderForPayPlusCallback["payment"];
  },
): OrderForPayPlusCallback {
  const snapshotParsed = orderCommercialSnapshotSchema.safeParse(doc.commercialSnapshot);
  return {
    orderId,
    status: doc.status as OrderForPayPlusCallback["status"],
    commercialSnapshot: snapshotParsed.success ? snapshotParsed.data : null,
    payment: doc.payment ?? null,
  };
}

export async function handlePayPlusCallback(
  payload: PayPlusCallbackPayload,
): Promise<HandlePayPlusCallbackResult> {
  const orderId = payload.transaction.more_info?.trim();
  if (!orderId) {
    return { ok: false, httpStatus: 400, reason: "CORRELATION" };
  }

  await connectDb();
  const doc = await Order.findById(orderId)
    .select({ status: 1, commercialSnapshot: 1, payment: 1 })
    .lean();

  const order = doc ? toOrderForCallback(orderId, doc) : null;
  const decision = decidePayPlusCallback(order, payload);
  const completedAt = new Date().toISOString();

  if (decision.kind === "reject") {
    return { ok: false, httpStatus: 400, reason: decision.reason };
  }

  const persisted = await persistPayPlusCallbackDecision(
    decision,
    completedAt,
    payload.cardDetailsForPersistence,
  );
  if (!persisted.ok) {
    return { ok: false, httpStatus: 400, reason: persisted.reason };
  }

  const triggerFinbotIssuance =
    !persisted.idempotent && decision.kind === "mark_paid";

  return {
    ok: true,
    httpStatus: 200,
    idempotent: persisted.idempotent,
    orderId,
    triggerFinbotIssuance,
  };
}
