import { CheckoutPaymentReturnActions } from "@/components/checkout/CheckoutPaymentReturnActions";
import { authorizeCheckoutAccess } from "@/lib/checkout/authorizeCheckoutAccess";
import {
  findPaymentAttemptById,
  isPaymentInitRetryAllowed,
} from "@/lib/orders/paymentAttemptStatus";
import { assertValidOrderId } from "@/lib/orders/orderBlobPaths";
import { notFound } from "next/navigation";
import styles from "./page.module.scss";

type PaymentReturnPageProps = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ outcome?: string }>;
};

function outcomeMessage(outcome: string | undefined): string {
  switch (outcome) {
    case "success":
      return "התשלום עדיין נבדק במערכת. אם אישרתם תשלום, הסטטוס יתעדכן בקרוב.";
    case "failure":
      return "התשלום לא הושלם. אפשר לנסות שוב.";
    case "cancel":
      return "התשלום בוטל. אפשר לנסות שוב כשתרצו.";
    default:
      return "חזרתם מדף התשלום. הסטטוס המעודכן מוצג למטה.";
  }
}

export default async function CheckoutPaymentReturnPage({
  params,
  searchParams,
}: PaymentReturnPageProps) {
  const { orderId } = await params;
  const { outcome } = await searchParams;

  try {
    assertValidOrderId(orderId);
  } catch {
    notFound();
  }

  let orderStatus: string;
  let canRetry = false;

  try {
    const { order } = await authorizeCheckoutAccess(orderId, undefined, {
      mode: "view",
    });
    orderStatus = order.status;
    const activeAttempt = findPaymentAttemptById(
      order.payment?.attempts,
      order.payment?.activeAttemptId ?? null,
    );
    canRetry = isPaymentInitRetryAllowed({
      orderStatus: order.status,
      hasCommercialSnapshot: Boolean(order.commercialSnapshot),
      activeAttempt,
    });
  } catch {
    notFound();
  }

  const statusLabel =
    orderStatus === "paid"
      ? "שולם"
      : orderStatus === "payment_pending"
        ? "ממתין לתשלום"
        : orderStatus === "draft"
          ? "טיוטה"
          : orderStatus;

  return (
    <main className={styles.main} dir="rtl">
      <div className={styles.inner}>
        <h1 className={styles.title}>תשלום</h1>
        <p className={styles.lead}>{outcomeMessage(outcome)}</p>
        <p className={styles.status} role="status">
          סטטוס הזמנה במערכת: <strong>{statusLabel}</strong>
        </p>
        <CheckoutPaymentReturnActions
          orderId={orderId}
          canRetry={canRetry}
          showCheckoutLink={orderStatus === "draft"}
        />
      </div>
    </main>
  );
}
