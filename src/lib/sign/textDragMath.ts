/** Pointer delta (px) → text offset units (% of sign canvas width/height). */
export function pointerDeltaToTextOffset(
  deltaClientX: number,
  deltaClientY: number,
  canvasWidthPx: number,
  canvasHeightPx: number,
): { dOffsetX: number; dOffsetY: number } {
  if (canvasWidthPx <= 0 || canvasHeightPx <= 0) {
    return { dOffsetX: 0, dOffsetY: 0 };
  }
  return {
    dOffsetX: (deltaClientX / canvasWidthPx) * 100,
    dOffsetY: (deltaClientY / canvasHeightPx) * 100,
  };
}
