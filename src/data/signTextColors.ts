import type { SignTextMulticolorId, TextColor } from "@/types/signDesign";

export type SignTextSolidColor = {
  hex: string;
  label: string;
};

export type SignTextMulticolorOption = {
  preset: SignTextMulticolorId;
  label: string;
};

/** Eight curated solids — hex stored in customer state for print/order. */
export const signTextSolidColors: SignTextSolidColor[] = [
  { hex: "#1f1b18", label: "פחם" },
  { hex: "#ffffff", label: "לבן" },
  { hex: "#2d4a3e", label: "ירוק כהה" },
  { hex: "#c46953", label: "טרקוטה" },
  { hex: "#6d5a4a", label: "חום חם" },
  { hex: "#1f3d5c", label: "כחול עמוק" },
  { hex: "#8b4658", label: "בורdeaux" },
  { hex: "#c89932", label: "זהב" },
];

export const signTextMulticolorOptions: SignTextMulticolorOption[] = [
  { preset: "rainbow", label: "צבעוני" },
  { preset: "sunset", label: "שקיעה" },
  { preset: "ocean", label: "ים" },
  { preset: "pastel", label: "פסטל" },
];

export function solidTextColor(hex: string): TextColor {
  return { kind: "solid", hex };
}

export function multicolorTextColor(preset: SignTextMulticolorId): TextColor {
  return { kind: "multicolor", preset };
}

export function textColorsEqual(a: TextColor, b: TextColor): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "solid" && b.kind === "solid") return a.hex === b.hex;
  if (a.kind === "multicolor" && b.kind === "multicolor") return a.preset === b.preset;
  return false;
}

export function isMulticolorTextColor(color: TextColor): color is {
  kind: "multicolor";
  preset: SignTextMulticolorId;
} {
  return color.kind === "multicolor";
}
