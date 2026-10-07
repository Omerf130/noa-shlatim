import { LEGACY_ORDER_LINE_ID } from "@/lib/orders/orderItemConstants";
import { isValidOrderItemQuantity } from "@/lib/orders/validateOrderItemQuantity";
import type { OrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";
import type { OrderItemDocument, OrderStoredAsset } from "@/models/Order";

export type ResolvedOrderItem = {
  lineId: string;
  quantity: number;
  creationMode: "photo" | "illustration";
  design: OrderDesignSnapshot;
  assets: {
    originalImage?: OrderStoredAsset;
    finalArtwork?: OrderStoredAsset;
  };
};

export type OrderLikeForResolveItems = {
  creationMode?: "photo" | "illustration" | null;
  design?: unknown;
  assets?: {
    originalImage?: OrderStoredAsset | null;
    finalArtwork?: OrderStoredAsset | null;
  } | null;
  items?: OrderItemDocument[] | null;
};

const CREATION_MODES = new Set(["photo", "illustration"]);

function isPersistedOrderItem(item: unknown): item is OrderItemDocument {
  if (!item || typeof item !== "object") {
    return false;
  }
  const row = item as Record<string, unknown>;
  if (typeof row.lineId !== "string" || !row.lineId.trim()) {
    return false;
  }
  if (!isValidOrderItemQuantity(row.quantity)) {
    return false;
  }
  if (typeof row.creationMode !== "string" || !CREATION_MODES.has(row.creationMode)) {
    return false;
  }
  if (row.design == null || typeof row.design !== "object") {
    return false;
  }
  return true;
}

function mapPersistedItem(item: OrderItemDocument): ResolvedOrderItem {
  const assets = item.assets ?? {};
  return {
    lineId: item.lineId,
    quantity: item.quantity,
    creationMode: item.creationMode,
    design: item.design as OrderDesignSnapshot,
    assets: {
      ...(assets.originalImage ? { originalImage: assets.originalImage } : {}),
      ...(assets.finalArtwork ? { finalArtwork: assets.finalArtwork } : {}),
    },
  };
}

function hasLegacyTopLevel(order: OrderLikeForResolveItems): boolean {
  if (!order.creationMode || !CREATION_MODES.has(order.creationMode)) {
    return false;
  }
  if (order.design == null || typeof order.design !== "object") {
    return false;
  }
  return true;
}

function legacySynthesizedItem(order: OrderLikeForResolveItems): ResolvedOrderItem {
  const assets = order.assets ?? {};
  return {
    lineId: LEGACY_ORDER_LINE_ID,
    quantity: 1,
    creationMode: order.creationMode as "photo" | "illustration",
    design: order.design as OrderDesignSnapshot,
    assets: {
      ...(assets.originalImage ? { originalImage: assets.originalImage } : {}),
      ...(assets.finalArtwork ? { finalArtwork: assets.finalArtwork } : {}),
    },
  };
}

/**
 * Canonical product lines for an Order — persisted items[] or legacy top-level.
 * When both exist, items[] wins (no merge).
 */
/** True when persisted items[] (not legacy top-level) drive checkout lines. */
export function orderHasPersistedCheckoutItems(
  order: OrderLikeForResolveItems,
): boolean {
  const persisted = order.items ?? [];
  return persisted.some(isPersistedOrderItem);
}

export function resolveOrderItems(
  order: OrderLikeForResolveItems,
): ResolvedOrderItem[] {
  const persisted = order.items ?? [];
  const validItems = persisted.filter(isPersistedOrderItem);
  if (validItems.length > 0) {
    return validItems.map(mapPersistedItem);
  }

  if (hasLegacyTopLevel(order)) {
    return [legacySynthesizedItem(order)];
  }

  return [];
}
