"use client";

import { SignDecorationSvg } from "@/components/sign/decorations/SignDecorationSvg";
import { useSignCompositionDrag } from "@/hooks/useSignCompositionDrag";
import { clampDecorationXY } from "@/lib/sign/compositionBounds";
import { pointerDeltaToDecorationXY } from "@/lib/sign/decorationDragMath";
import { resolveDecorationColor } from "@/data/signDecorations";
import { getDecorationPositionStyle } from "@/lib/sign/decorationPlacement";
import { decorationSizeCqw } from "@/lib/sign/signCanvasUnits";
import type { DecorationInstance } from "@/types/signDesign";
import type { MutableRefObject } from "react";
import styles from "./SignPreview.module.scss";

type SignDecorationItemProps = {
  decoration: DecorationInstance;
  editorEnabled: boolean;
  selected: boolean;
  canvasMeasureRef: MutableRefObject<{ canvasW: number; canvasH: number }>;
  onSelect: (id: string) => void;
  onPatch: (
    id: string,
    patch: Partial<Pick<DecorationInstance, "x" | "y" | "scale" | "color">>,
  ) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
};

export function SignDecorationItem({
  decoration,
  editorEnabled,
  selected,
  canvasMeasureRef,
  onSelect,
  onPatch,
  onDragStart,
  onDragEnd,
}: SignDecorationItemProps) {
  const { bindDragTarget } = useSignCompositionDrag({
    onDragStart,
    onDragEnd,
    onDragMove: (deltaX, deltaY, startState) => {
      const { canvasW, canvasH } = canvasMeasureRef.current;
      const { dOffsetX, dOffsetY } = pointerDeltaToDecorationXY(
        deltaX,
        deltaY,
        canvasW,
        canvasH,
      );
      const clamped = clampDecorationXY(
        startState.x + dOffsetX,
        startState.y + dOffsetY,
      );
      onPatch(decoration.id, clamped);
    },
  });

  const dragHandlers = bindDragTarget({ x: decoration.x, y: decoration.y });
  const iconSize = decorationSizeCqw(decoration.scale);

  return (
    <div
      className={styles.decorationPositionLayer}
      style={getDecorationPositionStyle(decoration.x, decoration.y)}
      aria-hidden={editorEnabled ? undefined : true}
    >
      <div
        className={[
          styles.decorationDraggable,
          editorEnabled ? styles.decorationDraggableEditor : "",
          selected ? styles.compositionSelected : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          width: iconSize,
          height: iconSize,
          color: resolveDecorationColor(decoration),
        }}
        {...(editorEnabled
          ? {
              ...dragHandlers,
              onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
                onSelect(decoration.id);
                dragHandlers.onPointerDown(e);
              },
              role: "button" as const,
              tabIndex: 0,
              "aria-label": "גרירת קישוט על השלט",
            }
          : {})}
      >
        <SignDecorationSvg type={decoration.type} width="100%" height="100%" />
      </div>
    </div>
  );
}
