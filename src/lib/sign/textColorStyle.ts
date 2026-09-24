import type { TextColor } from "@/types/signDesign";

export function solidTextColorCss(color: TextColor): string | undefined {
  if (color.kind === "solid") return color.hex;
  return undefined;
}
