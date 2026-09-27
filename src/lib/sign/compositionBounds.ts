import type { IllustrationTransform } from "@/types/signDesign";

export const ILLUSTRATION_XY_MIN = -40;
export const ILLUSTRATION_XY_MAX = 40;

export const TEXT_OFFSET_MIN = -30;
export const TEXT_OFFSET_MAX = 30;

export const DECORATION_XY_MIN = 8;
export const DECORATION_XY_MAX = 92;

export const DECORATION_SCALE_MIN = 0.5;
export const DECORATION_SCALE_MAX = 2;

export function clampIllustrationXY(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.min(ILLUSTRATION_XY_MAX, Math.max(ILLUSTRATION_XY_MIN, x)),
    y: Math.min(ILLUSTRATION_XY_MAX, Math.max(ILLUSTRATION_XY_MIN, y)),
  };
}

export function clampIllustrationTransform(
  patch: Partial<IllustrationTransform>,
  current: IllustrationTransform,
): Partial<IllustrationTransform> {
  const next = { ...current, ...patch };
  const clamped = clampIllustrationXY(next.x, next.y);
  return {
    ...patch,
    x: clamped.x,
    y: clamped.y,
  };
}

export function clampTextOffset(offsetX: number, offsetY: number): {
  offsetX: number;
  offsetY: number;
} {
  return {
    offsetX: Math.min(TEXT_OFFSET_MAX, Math.max(TEXT_OFFSET_MIN, offsetX)),
    offsetY: Math.min(TEXT_OFFSET_MAX, Math.max(TEXT_OFFSET_MIN, offsetY)),
  };
}

export function clampDecorationXY(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.min(DECORATION_XY_MAX, Math.max(DECORATION_XY_MIN, x)),
    y: Math.min(DECORATION_XY_MAX, Math.max(DECORATION_XY_MIN, y)),
  };
}

export function clampDecorationScale(scale: number): number {
  return Math.min(DECORATION_SCALE_MAX, Math.max(DECORATION_SCALE_MIN, scale));
}
