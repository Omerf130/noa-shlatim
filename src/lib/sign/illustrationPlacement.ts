import type { CSSProperties } from "react";

/** Canvas-center anchor; x/y in canvas % via cqw/cqh; scale on img. */
export function getIllustrationPlacementStyle(
  x: number,
  y: number,
  scale: number,
): { anchor: CSSProperties; imgTransform: string } {
  return {
    anchor: {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: `translate(calc(-50% + ${x}cqw), calc(-50% + ${y}cqh))`,
      pointerEvents: "none",
    },
    imgTransform: `scale(${scale})`,
  };
}
