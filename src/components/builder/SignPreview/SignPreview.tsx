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
import { pointerDeltaToTextOffset } from "@/lib/sign/textDragMath";
import { getTextLayerPlacement } from "@/lib/sign/textPlacement";
import { useSignCompositionDrag } from "@/hooks/useSignCompositionDrag";
import { SignBackgroundLayer } from "@/components/sign/SignBackgroundLayer/SignBackgroundLayer";
import { SignFrame } from "@/components/sign/SignFrame/SignFrame";
import type {
  DesignSelectedElement,
  DesignWorkspaceTab,
} from "@/types/builder";
import type { IllustrationTransform, SignDesignState, TextDesign } from "@/types/signDesign";
import { useCallback, useEffect, useRef, useState } from "react";
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
};

type SignPreviewProps = {
  design: SignDesignState;
  size?: SignPreviewSize;
  showMockDisclaimer?: boolean;
  className?: string;
  ariaLabel?: string;
  compositionEditor?: CompositionEditorConfig;
};

function textScaleForSize(size: SignPreviewSize): number {
  switch (size) {
    case "compact":
      return 0.5;
    case "hero":
    case "workspace":
      return 1.05;
    case "large":
      return 1.1;
    case "showcase":
      return 0.72;
    case "mobileStage":
      return 0.82;
    default:
      return 1;
  }
}

export function SignPreview({
  design,
  size = "default",
  showMockDisclaimer = false,
  className,
  ariaLabel,
  compositionEditor,
}: SignPreviewProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const illustrationImgRef = useRef<HTMLImageElement>(null);
  const illustrationDraggableRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragMeasureRef = useRef({ imgW: 0, imgH: 0, canvasW: 0, canvasH: 0 });

  const editorEnabled = Boolean(compositionEditor);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      setCanvasSize({ w: rect.width, h: rect.height });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const background = getBackgroundById(design.backgroundId);
  const styleMeta = getIllustrationStyleById(design.illustration?.styleId ?? null);
  const filterClass =
    design.illustration?.source === "mockAi" && styleMeta
      ? styles[styleMeta.previewFilter]
      : "";

  const { x, y, scale } = design.illustrationTransform;
  const illustrationTransform = `translate(${x}%, ${y}%) scale(${scale})`;

  const textLayerPlacement = getTextLayerPlacement(
    design.text.position,
    design.text.offsetX,
    design.text.offsetY,
    canvasSize.w,
    canvasSize.h,
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
    dragMeasureRef.current = {
      imgW: (illustrationDraggableRef.current ?? illustrationImgRef.current)?.offsetWidth ?? 0,
      imgH: (illustrationDraggableRef.current ?? illustrationImgRef.current)?.offsetHeight ?? 0,
      canvasW: canvasRect?.width ?? 0,
      canvasH: canvasRect?.height ?? 0,
    };
  }, []);

  const { bindDragTarget: bindIllustrationDrag } = useSignCompositionDrag({
    onDragStart: () => {
      captureDragMeasure();
      setIsDragging(true);
    },
    onDragEnd: () => setIsDragging(false),
    onDragMove: (deltaX, deltaY, startState) => {
      if (!compositionEditor) return;
      const { imgW, imgH } = dragMeasureRef.current;
      const { dx, dy } = pointerDeltaToIllustrationXY(deltaX, deltaY, imgW, imgH);
      const clamped = clampIllustrationXY(startState.x + dx, startState.y + dy);
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

  const illustrationSelected =
    editorEnabled && compositionEditor?.selectedElement === "illustration";
  const textSelected = editorEnabled && compositionEditor?.selectedElement === "text";

  const illustrationDragHandlers = bindIllustrationDrag({ x, y });
  const textDragHandlers = bindTextDrag({
    offsetX: design.text.offsetX,
    offsetY: design.text.offsetY,
  });

  const focusIllustration = () => {
    compositionEditor?.onFocusTool("image");
    compositionEditor?.onSelectElement("illustration");
  };

  const focusText = () => {
    compositionEditor?.onFocusTool("text");
    compositionEditor?.onSelectElement("text");
  };

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
            <div
              className={[
                styles.illustrationLayer,
                editorEnabled ? styles.illustrationLayerEditor : "",
              ].join(" ")}
            >
              {editorEnabled ? (
                <div
                  ref={illustrationDraggableRef}
                  className={[
                    styles.compositionDraggable,
                    styles.compositionDraggableActive,
                    illustrationSelected ? styles.compositionSelected : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ transform: illustrationTransform }}
                  {...illustrationDragHandlers}
                  onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => {
                    focusIllustration();
                    illustrationDragHandlers.onPointerDown(e);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="גרירת האיור על השלט"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={illustrationImgRef}
                    src={design.illustration.objectUrl}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    className={[styles.illustrationImg, filterClass].filter(Boolean).join(" ")}
                  />
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  ref={illustrationImgRef}
                  src={design.illustration.objectUrl}
                  alt=""
                  aria-hidden="true"
                  className={[styles.illustrationImg, filterClass].filter(Boolean).join(" ")}
                  style={{ transform: illustrationTransform }}
                />
              )}
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
                  fontSize: `${Math.round(design.text.size * textScaleForSize(size))}px`,
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
