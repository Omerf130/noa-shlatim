import { LEGACY_ORDER_LINE_ID } from "@/lib/orders/orderItemConstants";
import {
  resolveOrderItems,
  type OrderLikeForResolveItems,
} from "@/lib/orders/resolveOrderItems";

export const ADMIN_ORDER_ASSET_TYPES = ["original", "artwork"] as const;

export type AdminOrderAssetType = (typeof ADMIN_ORDER_ASSET_TYPES)[number];

/** Order statuses where persisted production assets may be served to Admin. */
export const ADMIN_ORDER_ASSET_ALLOWED_STATUSES = [
  "draft",
  "payment_pending",
  "paid",
] as const;

export type AdminOrderAssetAllowedStatus =
  (typeof ADMIN_ORDER_ASSET_ALLOWED_STATUSES)[number];

export function isAdminOrderAssetAccessAllowed(params: {
  status: string;
  creationMode?: string | null;
  items?: unknown;
  design?: unknown;
}): boolean {
  if (!(ADMIN_ORDER_ASSET_ALLOWED_STATUSES as readonly string[]).includes(params.status)) {
    return false;
  }
  const resolved = resolveOrderItems({
    creationMode: params.creationMode as "photo" | "illustration" | undefined,
    design: params.design,
    items: params.items as Parameters<typeof resolveOrderItems>[0]["items"],
  });
  return resolved.length > 0;
}

export function isAdminOrderAssetType(value: string): value is AdminOrderAssetType {
  return (ADMIN_ORDER_ASSET_TYPES as readonly string[]).includes(value);
}

export function adminOrderAssetApiPath(
  orderId: string,
  assetType: AdminOrderAssetType,
): string {
  return `/api/admin/orders/${orderId}/assets/${assetType}`;
}

export function adminOrderItemAssetApiPath(
  orderId: string,
  lineId: string,
  assetType: AdminOrderAssetType,
): string {
  return `/api/admin/orders/${orderId}/items/${lineId}/assets/${assetType}`;
}

/** First line with final artwork — secure Admin API path (not Blob URL). */
export function resolveAdminOrderArtworkThumbnailApiPath(
  orderId: string,
  order: OrderLikeForResolveItems,
): string | null {
  const resolved = resolveOrderItems(order);
  for (const line of resolved) {
    if (!line.assets.finalArtwork?.pathname) {
      continue;
    }
    if (line.lineId === LEGACY_ORDER_LINE_ID) {
      return adminOrderAssetApiPath(orderId, "artwork");
    }
    return adminOrderItemAssetApiPath(orderId, line.lineId, "artwork");
  }
  return null;
}

export function resolveOrderItemAssetPathname(
  order: OrderLikeForResolveItems,
  lineId: string,
  assetType: AdminOrderAssetType,
): string | null {
  const resolved = resolveOrderItems(order);
  const line = resolved.find((item) => item.lineId === lineId);
  if (!line) {
    return null;
  }
  if (assetType === "original") {
    return line.assets.originalImage?.pathname ?? null;
  }
  return line.assets.finalArtwork?.pathname ?? null;
}
