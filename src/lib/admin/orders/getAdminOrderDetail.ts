import { buildAdminOrderDetailDto } from "@/lib/admin/orders/adminOrderDtos";
import { isAdminVisibleOrderDocument } from "@/lib/admin/orders/adminOrderVisibility";
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

  if (!isAdminVisibleOrderDocument(order)) {
    return null;
  }

  return await buildAdminOrderDetailDto(order);
}
