const ORDER_ID_HEX = /^[a-f0-9]{24}$/i;

export function assertValidOrderId(orderId: string): void {
  if (!ORDER_ID_HEX.test(orderId)) {
    throw new Error("Invalid order id");
  }
}

export function orderOriginalPath(orderId: string, ext: string): string {
  assertValidOrderId(orderId);
  const safeExt = ext.replace(/[^a-z0-9]/gi, "");
  if (!safeExt) {
    throw new Error("Invalid extension");
  }
  return `orders/${orderId}/original.${safeExt}`;
}

export function orderArtworkPath(orderId: string): string {
  assertValidOrderId(orderId);
  return `orders/${orderId}/artwork.png`;
}
