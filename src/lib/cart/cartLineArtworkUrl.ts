export function cartLineArtworkApiPath(lineId: string): string {
  return `/api/cart/items/${encodeURIComponent(lineId)}/artwork`;
}
