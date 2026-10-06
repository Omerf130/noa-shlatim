import { CheckoutPaymentReturnView } from "@/components/checkout/CheckoutPaymentReturnView";
import { authorizeCheckoutAccess } from "@/lib/checkout/authorizeCheckoutAccess";
import { formatOrderReference } from "@/lib/admin/orders/formatOrderReference";
import { computeCheckoutPaymentUiState } from "@/lib/orders/checkoutPaymentReturnState";
import { assertValidOrderId } from "@/lib/orders/orderBlobPaths";
import { notFound } from "next/navigation";
import styles from "./page.module.scss";

type PaymentReturnPageProps = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ outcome?: string }>;
};

async function loadPaymentReturnContext(orderId: string) {
  const { order } = await authorizeCheckoutAccess(orderId, undefined, {
    mode: "view",
  });

  const ui = computeCheckoutPaymentUiState({
    orderStatus: order.status,
    commercialSnapshot: order.commercialSnapshot,
    payment: order.payment,
  });

  return {
    orderId,
    ui,
    orderReference: formatOrderReference(orderId),
    showCheckoutLink: order.status === "draft",
  };
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

  let context: Awaited<ReturnType<typeof loadPaymentReturnContext>>;
  try {
    context = await loadPaymentReturnContext(orderId);
  } catch {
    notFound();
  }

  return (
    <main className={styles.main} dir="rtl">
      <div className={styles.inner}>
        <CheckoutPaymentReturnView
          orderId={context.orderId}
          initialStatus={context.ui.status}
          initialCanRetry={context.ui.canRetryPayment}
          orderReference={context.orderReference}
          outcomeHint={outcome}
          showCheckoutLink={context.showCheckoutLink}
        />
      </div>
    </main>
  );
}
