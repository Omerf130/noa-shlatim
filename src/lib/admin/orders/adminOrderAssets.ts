export const ADMIN_ORDER_ASSET_TYPES = ["original", "artwork"] as const;

export type AdminOrderAssetType = (typeof ADMIN_ORDER_ASSET_TYPES)[number];

export function isAdminOrderAssetType(value: string): value is AdminOrderAssetType {
  return (ADMIN_ORDER_ASSET_TYPES as readonly string[]).includes(value);
}

export function adminOrderAssetApiPath(
  orderId: string,
  assetType: AdminOrderAssetType,
): string {
  return `/api/admin/orders/${orderId}/assets/${assetType}`;
}

export function resolveOrderAssetPathname(
  order: {
    assets?: {
      originalImage?: { pathname: string };
      finalArtwork?: { pathname: string };
    };
  },
  assetType: AdminOrderAssetType,
): string | null {
  if (assetType === "original") {
    return order.assets?.originalImage?.pathname ?? null;
  }
  return order.assets?.finalArtwork?.pathname ?? null;
}
