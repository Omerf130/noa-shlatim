import type { AdminDashboardRecentOrderDto } from "@/lib/admin/dashboard/adminDashboardDtos";
import {
  adminDashboardPaymentStatus,
  adminDashboardWorkflowStatus,
  formatDashboardOrderDateParts,
} from "@/lib/admin/dashboard/adminDashboardOrderPresentation";
import { adminOrderAssetApiPath } from "@/lib/admin/orders/adminOrderAssets";
import { buildAdminOrderListItemDto } from "@/lib/admin/orders/adminOrderDtos";

type OrderLeanForRecent = Parameters<typeof buildAdminOrderListItemDto>[0];

export function buildAdminDashboardRecentOrderDto(
  order: OrderLeanForRecent,
): AdminDashboardRecentOrderDto | null {
  const item = buildAdminOrderListItemDto(order);
  if (!item) {
    return null;
  }

  const { dateLine, timeLine } = formatDashboardOrderDateParts(order.createdAt);
  const email = order.customer?.email?.trim() || null;

  return {
    ...item,
    customerEmail: email,
    createdAtDateLine: dateLine,
    createdAtTimeLine: timeLine,
    paymentStatus: adminDashboardPaymentStatus(item.statusKey),
    workflowStatus: adminDashboardWorkflowStatus(item.statusKey),
    artworkThumbnailUrl: order.assets?.finalArtwork
      ? adminOrderAssetApiPath(item.orderId, "artwork")
      : null,
  };
}
