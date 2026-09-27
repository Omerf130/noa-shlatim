"use client";

import { getBackgroundById } from "@/data/signBackgrounds";
import { getIllustrationStyleById } from "@/data/illustrationStyles";
import { getSignTextFontOption } from "@/data/signTextFonts";
import { isMulticolorTextColor } from "@/data/signTextColors";
import { signTextFontFamily } from "@/lib/fonts/signTextFonts";
import { multicolorTextStyleClass } from "@/lib/sign/multicolorTextPresets";
import { solidTextColorCss } from "@/lib/sign/textColorStyle";
import { clampIllustrationXY, clampTextOffset } from "@/lib/sign/compositionBounds";
import { pointerDeltaToIllustrationXY } from "@/lib/sign/illustrationDragMath";
import { getIllustrationPlacementStyle } from "@/lib/sign/illustrationPlacement";
import { pointerDeltaToTextOffset } from "@/lib/sign/textDragMath";
import { getTextLayerPlacement } from "@/lib/sign/textPlacement";
import { textFontSizeCqw } from "@/lib/sign/signCanvasUnits";
import {
  getSelectedDecorationId,
  isIllustrationSelected,
  isTextSelected,
} from "@/lib/sign/designSelection";
import { useSignCompositionDrag } from "@/hooks/useSignCompositionDrag";
import { SignDecorationItem } from "@/components/builder/SignPreview/SignDecorationItem";
import type { DecorationInstance } from "@/types/signDesign";
import { SignBackgroundLayer } from "@/components/sign/SignBackgroundLayer/SignBackgroundLayer";
import { SignFrame } from "@/components/sign/SignFrame/SignFrame";
import type {
  DesignSelectedElement,
  DesignWorkspaceTab,
} from "@/types/builder";
import type { IllustrationTransform, SignDesignState, TextDesign } from "@/types/signDesign";
import { useCallback, useRef, useState } from "react";
import styles from "./SignPreview.module.scss";

export type SignPreviewSize =
  | "compact"
  | "default"
  | "large"
  | "workspace"
  | "hero"
  | "showcase"
  | "mobileStage";

export type CompositionEditorConfig = {
  activeTab: DesignWorkspaceTab;
  selectedElement: DesignSelectedElement | null;
  onSelectElement: (element: DesignSelectedElement | null) => void;
  onFocusTool: (tab: DesignWorkspaceTab) => void;
  onIllustrationTransformPatch: (patch: Partial<IllustrationTransform>) => void;
  onTextPatch: (patch: Partial<TextDesign>) => void;
  onDecorationPatch: (
    id: string,
    patch: Partial<Pick<DecorationInstance, "x" | "y" | "scale" | "color">>,
  ) => void;
};

type SignPreviewProps = {
  design: SignDesignState;
  size?: SignPreviewSize;
  showMockDisclaimer?: boolean;
  className?: string;
  ariaLabel?: string;
  compositionEditor?: CompositionEditorConfig;
};

export function SignPreview({
  design,
  size = "default",
  showMockDisclaimer = false,
  className,
  ariaLabel,
  compositionEditor,
}: SignPreviewProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragMeasureRef = useRef({ canvasW: 0, canvasH: 0 });

  const editorEnabled = Boolean(compositionEditor);

  const background = getBackgroundById(design.backgroundId);
  const styleMeta = getIllustrationStyleById(design.illustration?.styleId ?? null);
  const filterClass =
    design.illustration?.source === "mockAi" && styleMeta
      ? styles[styleMeta.previewFilter]
      : "";

  const { x, y, scale } = design.illustrationTransform;
  const illustrationPlacement = getIllustrationPlacementStyle(x, y, scale);

  const textLayerPlacement = getTextLayerPlacement(
    design.text.position,
    design.text.offsetX,
    design.text.offsetY,
  );

  const fontMeta = getSignTextFontOption(design.text.fontStyle);
  const textColor = design.text.color;
  const textMulticolor = isMulticolorTextColor(textColor);
  const multicolorClass = textMulticolor
    ? styles[multicolorTextStyleClass(textColor.preset)]
    : null;

  const altText = design.originalImage?.fileName
    ? `תצוגה מקדימה — ${design.originalImage.fileName}`
    : "תצוגה מקדימה של השלט";

  const captureDragMeasure = useCallback(() => {
    const canvas = canvasRef.current;
    const canvasRect = canvas?.getBoundingClientRect();
    const canvasW = canvasRect?.width ?? 0;
    const canvasH = canvasRect?.height ?? 0;
    dragMeasureRef.current = { canvasW, canvasH };
  }, []);

  const { bindDragTarget: bindIllustrationDrag } = useSignCompositionDrag({
    onDragStart: () => {
      captureDragMeasure();
      setIsDragging(true);
    },
    onDragEnd: () => setIsDragging(false),
    onDragMove: (deltaX, deltaY, startState) => {
      if (!compositionEditor) return;
      const { canvasW, canvasH } = dragMeasureRef.current;
      const { dOffsetX, dOffsetY } = pointerDeltaToIllustrationXY(
        deltaX,
        deltaY,
        canvasW,
        canvasH,
      );
      const clamped = clampIllustrationXY(
        startState.x + dOffsetX,
        startState.y + dOffsetY,
      );
      compositionEditor.onIllustrationTransformPatch(clamped);
    },
  });

  const { bindDragTarget: bindTextDrag } = useSignCompositionDrag({
    onDragStart: () => {
      captureDragMeasure();
      setIsDragging(true);
    },
    onDragEnd: () => setIsDragging(false),
    onDragMove: (deltaX, deltaY, startState) => {
      if (!compositionEditor) return;
      const { canvasW, canvasH } = dragMeasureRef.current;
      const { dOffsetX, dOffsetY } = pointerDeltaToTextOffset(
        deltaX,
        deltaY,
        canvasW,
        canvasH,
      );
      const clamped = clampTextOffset(
        startState.offsetX + dOffsetX,
        startState.offsetY + dOffsetY,
      );
      compositionEditor.onTextPatch({
        offsetX: clamped.offsetX,
        offsetY: clamped.offsetY,
      });
    },
  });

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!compositionEditor) return;
    if (e.target !== e.currentTarget) return;
    const tab = compositionEditor.activeTab;
    if (tab === "text" || tab === "image") {
      compositionEditor.onSelectElement(null);
    }
  };

  const selected = compositionEditor?.selectedElement ?? null;
  const illustrationSelected = editorEnabled && isIllustrationSelected(selected);
  const textSelected = editorEnabled && isTextSelected(selected);
  const selectedDecorationId = getSelectedDecorationId(selected);

  const illustrationDragHandlers = bindIllustrationDrag({ x, y });
  const textDragHandlers = bindTextDrag({
    offsetX: design.text.offsetX,
    offsetY: design.text.offsetY,
  });

  const focusIllustration = () => {
    compositionEditor?.onFocusTool("image");
    compositionEditor?.onSelectElement({ kind: "illustration" });
  };

  const focusText = () => {
    compositionEditor?.onFocusTool("text");
    compositionEditor?.onSelectElement({ kind: "text" });
  };

  const focusDecoration = (id: string) => {
    compositionEditor?.onFocusTool("text");
    compositionEditor?.onSelectElement({ kind: "decoration", id });
  };

  const illustrationImgClass = [
    styles.illustrationImg,
    filterClass,
    editorEnabled ? styles.illustrationImgEditor : "",
    illustrationSelected ? styles.compositionSelected : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={[
        styles.root,
        styles[size],
        editorEnabled ? styles.compositionEditorRoot : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role={editorEnabled ? "group" : "img"}
      aria-label={editorEnabled ? undefined : ariaLabel ?? altText}
    >
      <div className={styles.frameWrap}>
        <SignFrame
          material={design.material}
          canvasRef={canvasRef}
          canvasClassName={[
            editorEnabled ? styles.compositionCanvas : "",
            isDragging ? styles.compositionDragging : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onCanvasPointerDown={editorEnabled ? handleCanvasPointerDown : undefined}
        >
          {background ? (
            <SignBackgroundLayer background={background} />
          ) : (
            <div className={styles.emptyHint}>בחרו רקע כדי לראות תצוגה מלאה</div>
          )}

          {design.illustration && (
            <div className={styles.illustrationLayer}>
              <div
                className={styles.illustrationAnchor}
                style={illustrationPlacement.anchor}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={design.illustration.objectUrl}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  className={illustrationImgClass}
                  style={{ transform: illustrationPlacement.imgTransform }}
                  {...(editorEnabled
                    ? {
                        ...illustrationDragHandlers,
                        onPointerDown: (e: React.PointerEvent<HTMLImageElement>) => {
                          focusIllustration();
                          illustrationDragHandlers.onPointerDown(e);
                        },
                        role: "button" as const,
                        tabIndex: 0,
                        "aria-label": "גרירת האיור על השלט",
                      }
                    : {})}
                />
              </div>
            </div>
          )}

          {design.decorations.length > 0 && (
            <div className={styles.decorationsLayer} aria-hidden={editorEnabled ? undefined : true}>
              {design.decorations.map((decoration) => (
                <SignDecorationItem
                  key={decoration.id}
                  decoration={decoration}
                  editorEnabled={editorEnabled}
                  selected={editorEnabled && selectedDecorationId === decoration.id}
                  canvasMeasureRef={dragMeasureRef}
                  onSelect={focusDecoration}
                  onPatch={(id, patch) => compositionEditor?.onDecorationPatch(id, patch)}
                  onDragStart={() => {
                    captureDragMeasure();
                    setIsDragging(true);
                  }}
                  onDragEnd={() => setIsDragging(false)}
                />
              ))}
            </div>
          )}

          {design.text.value.trim() && (
            <div
              className={styles.textPositionLayer}
              style={textLayerPlacement}
              aria-hidden={editorEnabled ? undefined : true}
            >
              <div
                className={[
                  styles.textDraggable,
                  styles.textAlignCenter,
                  textMulticolor ? styles.textMulticolorBase : styles.textSolid,
                  multicolorClass,
                  editorEnabled ? styles.textDraggableEditor : "",
                  textSelected ? styles.compositionSelected : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  color: textMulticolor ? undefined : solidTextColorCss(design.text.color),
                  fontSize: textFontSizeCqw(design.text.size),
                  fontFamily: signTextFontFamily(design.text.fontStyle),
                  fontWeight: fontMeta.fontWeight,
                }}
                {...(editorEnabled
                  ? {
                      ...textDragHandlers,
                      onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
                        focusText();
                        textDragHandlers.onPointerDown(e);
                      },
                      role: "button" as const,
                      tabIndex: 0,
                      "aria-label": "גרירת הטקסט על השלט",
                    }
                  : {})}
              >
                {design.text.value}
              </div>
            </div>
          )}
        </SignFrame>
      </div>

      {showMockDisclaimer && design.illustration?.source === "mockAi" && (
        <p className={styles.mockBadge} role="note">
          תצוגת האיור היא דוגמה זמנית בלבד — לא מייצגת את איכות או המראה של האיור
          שיווצר בשלב הבא.
        </p>
      )}
    </div>
  );
}
