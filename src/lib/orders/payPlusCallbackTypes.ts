import type { OrderCommercialSnapshot } from "@/lib/orders/commercialSnapshot";
import type { PaymentAttemptRecord } from "@/lib/orders/paymentAttemptStatus";
import type { OrderStatus } from "@/models/Order";

export type OrderForPayPlusCallback = {
  orderId: string;
  status: OrderStatus;
  commercialSnapshot: OrderCommercialSnapshot | null | undefined;
  payment: {
    activeAttemptId?: string | null;
    attempts?: PaymentAttemptRecord[];
  } | null | undefined;
};
