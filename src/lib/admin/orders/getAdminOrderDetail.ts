import { buildAdminOrderDetailDto } from "@/lib/admin/orders/adminOrderDtos";
import { connectDb } from "@/lib/db/connect";
import { assertValidOrderId } from "@/lib/orders/orderBlobPaths";
import { Order } from "@/models/Order";

export async function getAdminOrderDetail(orderId: string) {
  try {
    assertValidOrderId(orderId);
  } catch {
    return null;
  }

  await connectDb();
  const order = await Order.findById(orderId).lean();
  if (!order) {
    return null;
  }

  const mode = order.creationMode;
  if (
    order.status !== "draft" ||
    (mode !== "photo" && mode !== "illustration")
  ) {
    return null;
  }

  return buildAdminOrderDetailDto(order);
}
