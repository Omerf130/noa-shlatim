import { isAdminVisibleOrderStatus } from "@/lib/admin/orders/adminOrderDtos";
import {
  resolveOrderItems,
  type OrderLikeForResolveItems,
} from "@/lib/orders/resolveOrderItems";

/** Whether an Order document should appear in Admin list/detail (matches list DTO rules). */
export function isAdminVisibleOrderDocument(
  order: OrderLikeForResolveItems & { status: string },
): boolean {
  if (!isAdminVisibleOrderStatus(order.status)) {
    return false;
  }

  return resolveOrderItems(order).length > 0;
}
