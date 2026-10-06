import type { AuthorizedCheckoutOrder } from "@/lib/checkout/authorizeCheckoutAccess";
import { formatOrderReference } from "@/lib/admin/orders/formatOrderReference";
import { computeCheckoutPaymentUiState } from "@/lib/orders/checkoutPaymentReturnState";
import type { OrderStatus } from "@/models/Order";

export type CustomerPaymentStatusDto = {
  ok: true;
  status: OrderStatus;
  canRetryPayment: boolean;
  orderReference: string;
};

export function buildCustomerPaymentStatusDto(
  auth: AuthorizedCheckoutOrder,
): CustomerPaymentStatusDto {
  const ui = computeCheckoutPaymentUiState({
    orderStatus: auth.order.status,
    commercialSnapshot: auth.order.commercialSnapshot,
    payment: auth.order.payment,
  });

  return {
    ok: true,
    status: ui.status,
    canRetryPayment: ui.canRetryPayment,
    orderReference: formatOrderReference(auth.orderId),
  };
}
