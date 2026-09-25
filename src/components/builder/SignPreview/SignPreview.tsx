import { getBackgroundById } from "@/data/signBackgrounds";
import { getIllustrationStyleById } from "@/data/illustrationStyles";
import { getSignTextFontOption } from "@/data/signTextFonts";
import { isMulticolorTextColor } from "@/data/signTextColors";
import { signTextFontFamily } from "@/lib/fonts/signTextFonts";
import { multicolorTextStyleClass } from "@/lib/sign/multicolorTextPresets";
import { solidTextColorCss } from "@/lib/sign/textColorStyle";
import { SignBackgroundLayer } from "@/components/sign/SignBackgroundLayer/SignBackgroundLayer";
import { SignFrame } from "@/components/sign/SignFrame/SignFrame";
import type { SignDesignState } from "@/types/signDesign";
import styles from "./SignPreview.module.scss";

type SignPreviewSize =
  | "compact"
  | "default"
  | "large"
  | "workspace"
  | "hero"
  | "showcase";

type SignPreviewProps = {
  design: SignDesignState;
  size?: SignPreviewSize;
  showMockDisclaimer?: boolean;
  className?: string;
  ariaLabel?: string;
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
}: SignPreviewProps) {
  const background = getBackgroundById(design.backgroundId);
  const styleMeta = getIllustrationStyleById(design.illustration?.styleId ?? null);
  const filterClass =
    design.illustration?.source === "mockAi" && styleMeta
      ? styles[styleMeta.previewFilter]
      : "";

  const { x, y, scale } = design.illustrationTransform;
  const illustrationTransform = `translate(${x}%, ${y}%) scale(${scale})`;

  const textPositionClass =
    design.text.position === "top"
      ? styles.textTop
      : design.text.position === "center"
        ? styles.textCenter
        : styles.textBottom;

  const fontMeta = getSignTextFontOption(design.text.fontStyle);
  const textColor = design.text.color;
  const textMulticolor = isMulticolorTextColor(textColor);
  const multicolorClass = textMulticolor
    ? styles[multicolorTextStyleClass(textColor.preset)]
    : null;

  const altText = design.originalImage?.fileName
    ? `תצוגה מקדימה — ${design.originalImage.fileName}`
    : "תצוגה מקדימה של השלט";

  return (
    <div
      className={[styles.root, styles[size], className].filter(Boolean).join(" ")}
      role="img"
      aria-label={ariaLabel ?? altText}
    >
      <div className={styles.frameWrap}>
        <SignFrame material={design.material}>
          {background ? (
            <SignBackgroundLayer background={background} />
          ) : (
            <div className={styles.emptyHint}>בחרו רקע כדי לראות תצוגה מלאה</div>
          )}

          {design.illustration && (
            <div className={styles.illustrationLayer}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={design.illustration.objectUrl}
                alt=""
                aria-hidden="true"
                className={[styles.illustrationImg, filterClass].filter(Boolean).join(" ")}
                style={{ transform: illustrationTransform }}
              />
            </div>
          )}

          {design.text.value.trim() && (
            <div
              className={[
                styles.textLayer,
                textPositionClass,
                styles.textAlignCenter,
                textMulticolor ? styles.textMulticolorBase : styles.textSolid,
                multicolorClass,
              ].join(" ")}
              style={{
                color: textMulticolor ? undefined : solidTextColorCss(design.text.color),
                fontSize: `${Math.round(design.text.size * textScaleForSize(size))}px`,
                fontFamily: signTextFontFamily(design.text.fontStyle),
                fontWeight: fontMeta.fontWeight,
              }}
              aria-hidden="true"
            >
              {design.text.value}
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
