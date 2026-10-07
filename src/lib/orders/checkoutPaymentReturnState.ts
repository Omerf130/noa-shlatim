import { hasValidCommercialSnapshot } from "@/lib/orders/commercialSnapshotAccess";
import {
  findPaymentAttemptById,
  isPaymentInitRetryAllowed,
  type PaymentAttemptRecord,
} from "@/lib/orders/paymentAttemptStatus";
import type { OrderStatus } from "@/models/Order";

export type CheckoutPaymentUiState = {
  status: OrderStatus;
  canRetryPayment: boolean;
};

export function hasPersistedCommercialSnapshot(
  commercialSnapshot: unknown,
): boolean {
  return hasValidCommercialSnapshot(commercialSnapshot);
}

/**
 * Single server-side source for return-page retry eligibility (Batch A/B rules).
 */
export function computeCheckoutPaymentUiState(params: {
  orderStatus: OrderStatus | string;
  commercialSnapshot: unknown;
  payment?: {
    activeAttemptId?: string | null;
    attempts?: PaymentAttemptRecord[];
  } | null;
  nowMs?: number;
}): CheckoutPaymentUiState {
  const status = params.orderStatus as OrderStatus;
  const activeAttempt = findPaymentAttemptById(
    params.payment?.attempts,
    params.payment?.activeAttemptId ?? null,
  );

  const canRetryPayment = isPaymentInitRetryAllowed({
    orderStatus: status,
    hasCommercialSnapshot: hasPersistedCommercialSnapshot(params.commercialSnapshot),
    activeAttempt,
    nowMs: params.nowMs,
  });

  return {
    status,
    canRetryPayment,
  };
}
