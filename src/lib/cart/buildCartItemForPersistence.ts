import type { OrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";
import type { CartStoredAsset } from "@/models/Cart";

export type NewCartItemPayload = {
  lineId: string;
  addIdempotencyKey: string;
  quantity: 1;
  creationMode: OrderDesignSnapshot["creationMode"];
  design: OrderDesignSnapshot;
  assets: {
    originalImage: CartStoredAsset;
    finalArtwork: CartStoredAsset;
  };
  addedAt: string;
};

export function buildCartItemForPersistence(params: {
  lineId: string;
  addIdempotencyKey: string;
  design: OrderDesignSnapshot;
  originalImage: CartStoredAsset;
  finalArtwork: CartStoredAsset;
  addedAt?: string;
}): NewCartItemPayload {
  return {
    lineId: params.lineId,
    addIdempotencyKey: params.addIdempotencyKey,
    quantity: 1,
    creationMode: params.design.creationMode,
    design: params.design,
    assets: {
      originalImage: params.originalImage,
      finalArtwork: params.finalArtwork,
    },
    addedAt: params.addedAt ?? new Date().toISOString(),
  };
}

/** Cart lines must not store client-supplied prices (C1). */
export function cartItemHasNoPricingFields(item: NewCartItemPayload): boolean {
  const keys = Object.keys(item as unknown as Record<string, unknown>);
  const forbidden = [
    "unitPrice",
    "lineTotal",
    "priceMinor",
    "subtotal",
    "promotion",
    "magnetPrice",
  ];
  if (forbidden.some((k) => keys.includes(k))) {
    return false;
  }
  const design = item.design as Record<string, unknown>;
  return !("priceMinor" in design) && !("unitPrice" in design);
}
