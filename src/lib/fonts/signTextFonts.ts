import type { SignTextFontStyleId } from "@/types/signDesign";

const CSS_VAR: Record<SignTextFontStyleId, string> = {
  clean: "var(--font-sign-text-clean)",
  soft: "var(--font-sign-text-soft)",
  personal: "var(--font-sign-text-personal)",
};

/** Client-safe — CSS variables are set on `<html>` in root layout. */
export function signTextFontFamily(id: SignTextFontStyleId): string {
  return `${CSS_VAR[id]}, var(--font-rubik), system-ui, sans-serif`;
}
