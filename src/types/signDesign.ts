export type CreationMode = "photo" | "illustration";

export type Material = "wood" | "magnet";

export type TextPosition = "top" | "center" | "bottom";

/** Stable ID for order/print — maps to loaded sign text fonts in the app. */
export type SignTextFontStyleId = "clean" | "soft" | "personal";

/** Stable multicolor preset — maps to curated gradient in preview/print. */
export type SignTextMulticolorId = "rainbow" | "sunset" | "ocean" | "pastel";

export type TextColor =
  | { kind: "solid"; hex: string }
  | { kind: "multicolor"; preset: SignTextMulticolorId };

export type LocalImageRef = {
  objectUrl: string;
  fileName: string;
  mimeType: string;
};

export type IllustrationSource = "upload" | "mockAi" | "ai";

export type IllustrationAsset = {
  objectUrl: string;
  source: IllustrationSource;
  styleId: string | null;
};

export type TextDesign = {
  value: string;
  color: TextColor;
  /** Logical px at reference canvas width 360 — rendered via cqw on sign canvas. */
  size: number;
  position: TextPosition;
  fontStyle: SignTextFontStyleId;
  /** Fine tuning as % of sign canvas width/height; 0 = preset anchor only. */
  offsetX: number;
  offsetY: number;
};

export type IllustrationTransform = {
  /** Offset from canvas center, % of canvas width (cqw). 0 = centered. */
  x: number;
  /** Offset from canvas center, % of canvas height (cqh). 0 = centered. */
  y: number;
  /** Scale multiplier; 1 = neutral (63cqw / 68cqh caps). */
  scale: number;
};

/** Stable catalog id — maps to curated SVG in signDecorations data. */
export type DecorationTypeId =
  | "heart"
  | "star"
  | "paw"
  | "leaf"
  | "flower"
  | "sparkle"
  | "house"
  | "sun";

export type DecorationInstance = {
  id: string;
  type: DecorationTypeId;
  /** Center anchor: % of sign canvas width from left. */
  x: number;
  /** Center anchor: % of sign canvas height from top. */
  y: number;
  scale: number;
  /** Solid hex — instance-specific (may differ from catalog default). */
  color: string;
};

export const defaultDecorationScale = 1;

export type SignDesignState = {
  creationMode: CreationMode | null;
  originalImage: LocalImageRef | null;
  /** Selected style on photo path (before / after generation). */
  photoIllustrationStyleId: string | null;
  illustration: IllustrationAsset | null;
  backgroundId: string | null;
  text: TextDesign;
  illustrationTransform: IllustrationTransform;
  decorations: DecorationInstance[];
  material: Material | null;
  magnetSizeId: string | null;
};

export const defaultTextColor: TextColor = { kind: "solid", hex: "#1f1b18" };

export const defaultTextDesign: TextDesign = {
  value: "",
  color: defaultTextColor,
  size: 24,
  position: "bottom",
  fontStyle: "clean",
  offsetX: 0,
  offsetY: 0,
};

export const defaultIllustrationTransform: IllustrationTransform = {
  x: 0,
  y: 0,
  scale: 1,
};

export const initialSignDesignState: SignDesignState = {
  creationMode: null,
  originalImage: null,
  photoIllustrationStyleId: null,
  illustration: null,
  backgroundId: null,
  text: defaultTextDesign,
  illustrationTransform: defaultIllustrationTransform,
  decorations: [],
  material: null,
  magnetSizeId: null,
};
