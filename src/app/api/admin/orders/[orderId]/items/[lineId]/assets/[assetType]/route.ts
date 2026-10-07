import {
  isAdminOrderAssetAccessAllowed,
  isAdminOrderAssetType,
  resolveOrderItemAssetPathname,
} from "@/lib/admin/orders/adminOrderAssets";
import {
  isAdminApiAuthFailure,
  requireAdminApiSession,
} from "@/lib/auth/adminApiAuth";
import { connectDb } from "@/lib/db/connect";
import { assertValidOrderId } from "@/lib/orders/orderBlobPaths";
import { getPrivateBlob } from "@/lib/storage/privateBlob";
import { streamPrivateImageResponse } from "@/lib/storage/streamPrivateImageResponse";
import { Order } from "@/models/Order";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ orderId: string; lineId: string; assetType: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdminApiSession();
  if (isAdminApiAuthFailure(auth)) {
    return auth;
  }

  const { orderId, lineId, assetType: assetTypeRaw } = await context.params;

  if (!isAdminOrderAssetType(assetTypeRaw)) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    assertValidOrderId(orderId);
  } catch {
    return new NextResponse(null, { status: 404 });
  }

  await connectDb();
  const order = await Order.findById(orderId).lean();
  if (
    !order ||
    !isAdminOrderAssetAccessAllowed({
      status: order.status,
      creationMode: order.creationMode,
      items: order.items,
      design: order.design,
    })
  ) {
    return new NextResponse(null, { status: 404 });
  }

  const pathname = resolveOrderItemAssetPathname(order, lineId, assetTypeRaw);
  if (!pathname) {
    return new NextResponse(null, { status: 404 });
  }

  const blob = await getPrivateBlob(pathname);
  if (!blob) {
    return new NextResponse(null, { status: 404 });
  }

  const fallback =
    assetTypeRaw === "artwork" ? "image/png" : "application/octet-stream";
  return streamPrivateImageResponse(blob, fallback);
}
