import type { CSSProperties } from "react";
import type { TextPosition } from "@/types/signDesign";

/**
 * Single source of truth: preset anchor + canvas-relative offsets (offsetX/Y are % of canvas).
 */
export function getTextLayerPlacement(
  position: TextPosition,
  offsetX: number,
  offsetY: number,
  canvasWidthPx: number,
  canvasHeightPx: number,
): CSSProperties {
  const dx = (offsetX / 100) * canvasWidthPx;
  const dy = (offsetY / 100) * canvasHeightPx;

  const shared: CSSProperties = {
    left: "50%",
    right: "auto",
    insetInline: "auto",
  };

  if (position === "top") {
    return {
      ...shared,
      top: "var(--space-3)",
      bottom: "auto",
      transform: `translate(calc(-50% + ${dx}px), ${dy}px)`,
    };
  }

  if (position === "bottom") {
    return {
      ...shared,
      top: "auto",
      bottom: "var(--space-3)",
      transform: `translate(calc(-50% + ${dx}px), ${dy}px)`,
    };
  }

  return {
    ...shared,
    top: "50%",
    bottom: "auto",
    transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`,
  };
}
