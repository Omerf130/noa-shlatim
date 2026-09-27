import type { DesignSelectedElement } from "@/types/builder";

export function isTextSelected(selected: DesignSelectedElement | null): boolean {
  return selected?.kind === "text";
}

export function isIllustrationSelected(
  selected: DesignSelectedElement | null,
): boolean {
  return selected?.kind === "illustration";
}

export function getSelectedDecorationId(
  selected: DesignSelectedElement | null,
): string | null {
  return selected?.kind === "decoration" ? selected.id : null;
}
