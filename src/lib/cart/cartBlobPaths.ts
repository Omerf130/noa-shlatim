import { isValidCartId } from "@/lib/cart/assertValidCartId";

const UUID_V4ISH =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assertValidCartLineId(lineId: string): void {
  if (!UUID_V4ISH.test(lineId)) {
    throw new Error("Invalid cart line id");
  }
}

export function cartItemOriginalPath(
  cartId: string,
  lineId: string,
  ext: string,
): string {
  if (!isValidCartId(cartId)) {
    throw new Error("Invalid cart id");
  }
  assertValidCartLineId(lineId);
  const safeExt = ext.replace(/[^a-z0-9]/gi, "");
  if (!safeExt) {
    throw new Error("Invalid extension");
  }
  return `carts/${cartId}/items/${lineId}/original.${safeExt}`;
}

export function cartItemArtworkPath(cartId: string, lineId: string): string {
  if (!isValidCartId(cartId)) {
    throw new Error("Invalid cart id");
  }
  assertValidCartLineId(lineId);
  return `carts/${cartId}/items/${lineId}/artwork.png`;
}
