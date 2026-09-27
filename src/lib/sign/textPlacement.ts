import type { CSSProperties } from "react";
import type { TextPosition } from "@/types/signDesign";
import { TEXT_PRESET_INSET_CQH } from "@/lib/sign/signCanvasUnits";

/**
 * Preset anchor + canvas-relative offsets (offsetX/Y = % of canvas width/height).
 */
export function getTextLayerPlacement(
  position: TextPosition,
  offsetX: number,
  offsetY: number,
): CSSProperties {
  const shared: CSSProperties = {
    left: "50%",
    right: "auto",
    insetInline: "auto",
  };

  const dx = `${offsetX}cqw`;
  const dy = `${offsetY}cqh`;

  if (position === "top") {
    return {
      ...shared,
      top: `${TEXT_PRESET_INSET_CQH}%`,
      bottom: "auto",
      transform: `translate(calc(-50% + ${dx}), ${dy})`,
    };
  }

  if (position === "bottom") {
    return {
      ...shared,
      top: "auto",
      bottom: `${TEXT_PRESET_INSET_CQH}%`,
      transform: `translate(calc(-50% + ${dx}), ${dy})`,
    };
  }

  return {
    ...shared,
    top: "50%",
    bottom: "auto",
    transform: `translate(calc(-50% + ${dx}), calc(-50% + ${dy}))`,
  };
}
