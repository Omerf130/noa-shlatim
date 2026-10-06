import {
  buildAdminOrderListItemDto,
  clampListPageParams,
  type AdminOrderListPageDto,
} from "@/lib/admin/orders/adminOrderDtos";
import { connectDb } from "@/lib/db/connect";
import { Order } from "@/models/Order";

export async function listAdminOrders(params: {
  page?: unknown;
  limit?: unknown;
}): Promise<AdminOrderListPageDto> {
  const { page, limit } = clampListPageParams(params.page, params.limit);

  await connectDb();

  const filter = {
    status: { $in: ["draft", "payment_pending", "paid", "creating"] as const },
    creationMode: { $in: ["photo", "illustration"] as const },
  };

  const [totalItems, orders] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const items = orders
    .map((order) => buildAdminOrderListItemDto(order))
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / limit);

  return {
    items,
    page,
    limit,
    totalItems,
    totalPages,
  };
}
