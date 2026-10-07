import type { OrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";

export const ADD_TO_CART_API_PATH = "/api/cart/items";

export function buildAddToCartFormData(params: {
  designPayload: OrderDesignSnapshot;
  addIdempotencyKey: string;
  originalFile: File;
  finalArtworkBlob: Blob;
}): FormData {
  const form = new FormData();
  form.append("design", JSON.stringify(params.designPayload));
  form.append("addIdempotencyKey", params.addIdempotencyKey);
  form.append(
    "originalImage",
    params.originalFile,
    params.originalFile.name || "original",
  );
  form.append("finalArtwork", params.finalArtworkBlob, "artwork.png");
  return form;
}
