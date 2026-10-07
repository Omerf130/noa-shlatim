import type { PaymentAttemptRecord } from "@/lib/orders/paymentAttemptStatus";
import type { OrderStatus } from "@/models/Order";

export type OrderForPayPlusCallback = {
  orderId: string;
  status: OrderStatus;
  commercialSnapshot: unknown;
  payment: {
    activeAttemptId?: string | null;
    attempts?: PaymentAttemptRecord[];
  } | null | undefined;
};
