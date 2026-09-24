import type { SignTextFontStyleId } from "@/types/signDesign";

export type SignTextFontOption = {
  id: SignTextFontStyleId;
  /** Customer-facing label in the text panel. */
  label: string;
  /** Short sample for the style picker preview. */
  previewSample: string;
  fontWeight: 400 | 500 | 600 | 700;
  /** Optional larger preview for display/handwriting styles. */
  previewSizeRem?: number;
};

export const signTextFontOptions: SignTextFontOption[] = [
  {
    id: "clean",
    label: "נקי",
    previewSample: "שלט",
    fontWeight: 600,
  },
  {
    id: "soft",
    label: "רך",
    previewSample: "שלט",
    fontWeight: 500,
  },
  {
    id: "personal",
    label: "אישי",
    previewSample: "שלט",
    fontWeight: 400,
    previewSizeRem: 1.5,
  },
];

export function getSignTextFontOption(
  id: SignTextFontStyleId,
): SignTextFontOption {
  return signTextFontOptions.find((o) => o.id === id) ?? signTextFontOptions[0];
}
