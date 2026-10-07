import { assertValidOrderId } from "@/lib/orders/orderBlobPaths";

const UUID_V4ISH =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assertValidOrderLineId(lineId: string): void {
  if (lineId === "legacy") {
    return;
  }
  if (!UUID_V4ISH.test(lineId)) {
    throw new Error("Invalid order line id");
  }
}

export function orderItemOriginalPath(
  orderId: string,
  lineId: string,
  ext: string,
): string {
  assertValidOrderId(orderId);
  assertValidOrderLineId(lineId);
  const safeExt = ext.replace(/[^a-z0-9]/gi, "");
  if (!safeExt) {
    throw new Error("Invalid extension");
  }
  return `orders/${orderId}/items/${lineId}/original.${safeExt}`;
}

export function orderItemArtworkPath(orderId: string, lineId: string): string {
  assertValidOrderId(orderId);
  assertValidOrderLineId(lineId);
  return `orders/${orderId}/items/${lineId}/artwork.png`;
}
