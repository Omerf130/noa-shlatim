import { formatDashboardAttentionDate } from "@/lib/admin/dashboard/adminDashboardOrderPresentation";
import {
  buildAdminOrderListItemDto,
  type AdminOrderListItemDto,
} from "@/lib/admin/orders/adminOrderDtos";
import { ADMIN_VISIBLE_ORDER_FILTER } from "@/lib/admin/orders/adminOrderQueryFilter";
import { connectDb } from "@/lib/db/connect";
import { Order } from "@/models/Order";

/**
 * Phase A dashboard panel only: orders awaiting PayPlus payment confirmation.
 * Not a general "requires attention" domain model — fulfillment will extend later.
 */
export type DashboardAttentionItemDto = AdminOrderListItemDto & {
  artworkThumbnailUrl: string | null;
  attentionDateLabel: string;
  issueLabel: string;
};

const ATTENTION_LIMIT = 5;

export async function getDashboardAttentionItems(): Promise<DashboardAttentionItemDto[]> {
  await connectDb();

  const orders = await Order.find({
    ...ADMIN_VISIBLE_ORDER_FILTER,
    status: "payment_pending",
  })
    .sort({ updatedAt: -1 })
    .limit(ATTENTION_LIMIT)
    .lean();

  return orders
    .map((order) => {
      const item = buildAdminOrderListItemDto(order);
      if (!item) {
        return null;
      }
      return {
        ...item,
        artworkThumbnailUrl: item.artworkThumbnailUrl,
        attentionDateLabel: formatDashboardAttentionDate(order.createdAt),
        issueLabel: "ממתינה לתשלום",
      };
    })
    .filter((item): item is DashboardAttentionItemDto => item !== null);
}
