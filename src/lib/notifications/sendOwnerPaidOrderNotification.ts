import {
  claimOwnerPaidNotification,
  type ClaimOwnerPaidNotificationResult,
  markOwnerPaidNotificationFailed,
  markOwnerPaidNotificationSent,
} from "@/lib/notifications/claimOwnerPaidNotification";
import { buildOwnerPaidOrderEmail } from "@/lib/notifications/buildOwnerPaidOrderEmail";
import { connectDb } from "@/lib/db/connect";
import { parseOrderCommercialSnapshot } from "@/lib/orders/commercialSnapshotAccess";
import type { PaymentAttemptRecord } from "@/lib/orders/paymentAttemptStatus";
import { validatePersistedCheckoutCustomer } from "@/lib/orders/validatePersistedCheckoutCustomer";
import { getResendNotificationConfig, type ResendNotificationConfig } from "@/lib/resend/env";
import { adminOrderDetailUrl } from "@/lib/site/siteUrl";
import { Order } from "@/models/Order";
import { Resend } from "resend";

export type SendOwnerPaidOrderNotificationResult =
  | { ok: true; outcome: "sent" | "skipped" }
  | { ok: true; outcome: "failed" }
  | { ok: false; reason: string };

export type ResendSendFn = (params: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}) => Promise<{ ok: true } | { ok: false; errorMessage: string }>;

async function defaultResendSend(params: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: true } | { ok: false; errorMessage: string }> {
  const resend = new Resend(params.apiKey);
  const result = await resend.emails.send({
    from: params.from,
    to: [params.to],
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  if (result.error) {
    return {
      ok: false,
      errorMessage: result.error.message?.trim() || "שגיאה בשליחת אימייל",
    };
  }

  return { ok: true };
}

function findSucceededPaymentAttempt(
  attempts: PaymentAttemptRecord[] | undefined,
): PaymentAttemptRecord | null {
  return attempts?.find((a) => a.status === "succeeded") ?? null;
}

type SendOwnerPaidOrderTestDeps = {
  getConfig?: () => ResendNotificationConfig | null;
  claim?: (orderId: string) => Promise<ClaimOwnerPaidNotificationResult>;
  loadPaidOrder?: (orderId: string) => Promise<{
    status: string;
    customer?: { fullName?: string; phone?: string; email?: string };
    commercialSnapshot?: unknown;
    payment?: { attempts?: PaymentAttemptRecord[] };
  } | null>;
  markSent?: (orderId: string, sentAtIso: string) => Promise<void>;
  markFailed?: (orderId: string, errorMessage: string) => Promise<void>;
};

export async function sendOwnerPaidOrderNotification(params: {
  orderId: string;
  resendSendFn?: ResendSendFn;
  _testDeps?: SendOwnerPaidOrderTestDeps;
}): Promise<SendOwnerPaidOrderNotificationResult> {
  const getConfig = params._testDeps?.getConfig ?? getResendNotificationConfig;
  const claimFn = params._testDeps?.claim ?? ((orderId: string) => claimOwnerPaidNotification({ orderId }));
  const markSentFn =
    params._testDeps?.markSent ??
    ((orderId: string, sentAtIso: string) => markOwnerPaidNotificationSent({ orderId, sentAtIso }));
  const markFailedFn =
    params._testDeps?.markFailed ??
    ((orderId: string, errorMessage: string) =>
      markOwnerPaidNotificationFailed({ orderId, errorMessage }));

  const config = getConfig();
  if (!config) {
    console.error("[owner-notification] Resend not configured");
    const claim = await claimFn(params.orderId);
    if (claim.ok && claim.claimed) {
      await markFailedFn(params.orderId, "הגדרות Resend חסרות בשרת");
    }
    return { ok: true, outcome: "failed" };
  }

  const claim = await claimFn(params.orderId);
  if (!claim.ok) {
    return { ok: false, reason: claim.reason };
  }
  if (!claim.claimed) {
    return { ok: true, outcome: "skipped" };
  }

  let order: Awaited<ReturnType<NonNullable<SendOwnerPaidOrderTestDeps["loadPaidOrder"]>>> | null;
  if (params._testDeps?.loadPaidOrder) {
    order = await params._testDeps.loadPaidOrder(params.orderId);
  } else {
    await connectDb();
    order = await Order.findById(params.orderId).lean();
  }
  if (!order || order.status !== "paid") {
    await markFailedFn(params.orderId, "ההזמנה אינה במצב שולם");
    return { ok: true, outcome: "failed" };
  }

  const snapshotParsed = parseOrderCommercialSnapshot(order.commercialSnapshot);
  if (!snapshotParsed) {
    await markFailedFn(params.orderId, "חסר snapshot מסחרי");
    return { ok: true, outcome: "failed" };
  }

  if (!validatePersistedCheckoutCustomer(order.customer)) {
    await markFailedFn(params.orderId, "פרטי לקוח חסרים");
    return { ok: true, outcome: "failed" };
  }

  const adminOrderUrl = adminOrderDetailUrl(params.orderId);
  if (!adminOrderUrl) {
    await markFailedFn(params.orderId, "SITE_URL לא מוגדר");
    return { ok: true, outcome: "failed" };
  }

  const succeeded = findSucceededPaymentAttempt(
    (order.payment?.attempts ?? []) as PaymentAttemptRecord[],
  );
  const paymentCompletedAtIso = succeeded?.completedAt?.trim() || new Date().toISOString();

  const email = buildOwnerPaidOrderEmail({
    orderId: params.orderId,
    customer: {
      fullName: order.customer!.fullName!.trim(),
      phone: order.customer!.phone!.trim(),
      email: order.customer!.email!.trim(),
    },
    snapshot: order.commercialSnapshot,
    paymentCompletedAtIso,
    adminOrderUrl,
  });

  const sendFn = params.resendSendFn ?? defaultResendSend;

  try {
    const sent = await sendFn({
      apiKey: config.apiKey,
      from: email.from,
      to: config.ownerEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    if (!sent.ok) {
      await markFailedFn(params.orderId, sent.errorMessage);
      return { ok: true, outcome: "failed" };
    }

    await markSentFn(params.orderId, new Date().toISOString());
    return { ok: true, outcome: "sent" };
  } catch (err) {
    console.error("[owner-notification] send failed", err);
    await markFailedFn(params.orderId, "שגיאה בשליחת אימייל לבעל העסק");
    return { ok: true, outcome: "failed" };
  }
}
