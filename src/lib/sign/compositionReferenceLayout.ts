import type { IllustrationTransform } from "@/types/signDesign";
import {
  ILLUSTRATION_MAX_CQH,
  ILLUSTRATION_MAX_CQW,
} from "@/lib/sign/signCanvasUnits";

export const COMPOSITION_REF_WIDTH = 768;
export const COMPOSITION_REF_HEIGHT = 512;

function parseObjectPositionPercent(value: string): number {
  const trimmed = value.trim();
  if (trimmed.endsWith("%")) {
    const n = Number.parseFloat(trimmed.slice(0, -1));
    return Number.isFinite(n) ? n / 100 : 0.5;
  }
  return 0.5;
}

/** Match SignBackgroundLayer object-fit: cover + object-position. */
export function computeCoverDrawRect(
  canvasW: number,
  canvasH: number,
  imageW: number,
  imageH: number,
  objectPosition: string,
): { x: number; y: number; w: number; h: number } {
  const parts = objectPosition.split(/\s+/);
  const focusX = parseObjectPositionPercent(parts[0] ?? "50%");
  const focusY = parseObjectPositionPercent(parts[1] ?? parts[0] ?? "50%");

  const scale = Math.max(canvasW / imageW, canvasH / imageH);
  const drawW = imageW * scale;
  const drawH = imageH * scale;
  const x = (canvasW - drawW) * focusX;
  const y = (canvasH - drawH) * focusY;

  return { x, y, w: drawW, h: drawH };
}

/**
 * Subject placement matching SignPreview: center anchor + cqw/cqh offset,
 * max 63% × 68% contain, then scale from center.
 */
export function computeSubjectDrawRect(
  canvasW: number,
  canvasH: number,
  imageNaturalW: number,
  imageNaturalH: number,
  transform: IllustrationTransform,
): { x: number; y: number; w: number; h: number } {
  const maxW = (ILLUSTRATION_MAX_CQW / 100) * canvasW;
  const maxH = (ILLUSTRATION_MAX_CQH / 100) * canvasH;

  const fitScale = Math.min(maxW / imageNaturalW, maxH / imageNaturalH);
  const baseW = imageNaturalW * fitScale;
  const baseH = imageNaturalH * fitScale;

  const drawW = baseW * transform.scale;
  const drawH = baseH * transform.scale;

  const centerX = canvasW / 2 + transform.x * (canvasW / 100);
  const centerY = canvasH / 2 + transform.y * (canvasH / 100);

  return {
    x: centerX - drawW / 2,
    y: centerY - drawH / 2,
    w: drawW,
    h: drawH,
  };
}
