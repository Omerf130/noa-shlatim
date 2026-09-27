import type { CSSProperties } from "react";

/** Outer wrapper: center anchor at canvas x/y percent. */
export function getDecorationPositionStyle(x: number, y: number): CSSProperties {
  return {
    left: `${x}%`,
    top: `${y}%`,
    transform: "translate(-50%, -50%)",
  };
}
