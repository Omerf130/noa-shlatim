import { LEGACY_ORDER_LINE_ID } from "@/lib/orders/orderItemConstants";

export function checkoutLineArtworkUrl(orderId: string, lineId: string): string {
  if (lineId === LEGACY_ORDER_LINE_ID) {
    return `/api/orders/${orderId}/artwork`;
  }
  return `/api/orders/${orderId}/items/${lineId}/artwork`;
}
