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

/**
 * Whether an authenticated Admin may stream this order's private Blob assets.
 * Does not include auth checks — route must call requireAdminApiSession first.
 */
export function isAdminOrderAssetAccessAllowed(params: {
  status: string;
  creationMode: string;
}): boolean {
  if (params.creationMode !== "photo" && params.creationMode !== "illustration") {
    return false;
  }
  return (ADMIN_ORDER_ASSET_ALLOWED_STATUSES as readonly string[]).includes(
    params.status,
  );
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
