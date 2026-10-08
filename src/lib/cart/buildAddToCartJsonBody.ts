import type { OrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";

export const ADD_TO_CART_API_PATH = "/api/cart/items";

export type AddToCartJsonBody = {
  design: OrderDesignSnapshot;
  addIdempotencyKey: string;
  signAssetStagingToken: string;
};

export function buildAddToCartJsonBody(params: AddToCartJsonBody): string {
  return JSON.stringify(params);
}
