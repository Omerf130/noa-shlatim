/** Pointer delta (px) → illustration transform x/y (CSS translate % units on the image). */
export function pointerDeltaToIllustrationXY(
  deltaClientX: number,
  deltaClientY: number,
  imgWidthPx: number,
  imgHeightPx: number,
): { dx: number; dy: number } {
  if (imgWidthPx <= 0 || imgHeightPx <= 0) {
    return { dx: 0, dy: 0 };
  }
  return {
    dx: (deltaClientX / imgWidthPx) * 100,
    dy: (deltaClientY / imgHeightPx) * 100,
  };
}
