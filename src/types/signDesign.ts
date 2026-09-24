export type CreationMode = "photo" | "illustration";

export type Material = "wood" | "magnet";

export type TextPosition = "top" | "center" | "bottom";

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
  color: string;
  size: number;
  position: TextPosition;
};

export type IllustrationTransform = {
  x: number;
  y: number;
  scale: number;
};

export type SignDesignState = {
  creationMode: CreationMode | null;
  originalImage: LocalImageRef | null;
  /** Selected style on photo path (before / after generation). */
  photoIllustrationStyleId: string | null;
  illustration: IllustrationAsset | null;
  backgroundId: string | null;
  text: TextDesign;
  illustrationTransform: IllustrationTransform;
  material: Material | null;
};

export const defaultTextDesign: TextDesign = {
  value: "",
  color: "#1f1b18",
  size: 24,
  position: "bottom",
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
  material: null,
};
