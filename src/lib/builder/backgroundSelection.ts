import type { SignBackground } from "@/types/signBackground";

export const BUILDER_BACKGROUNDS_UNAVAILABLE_MESSAGE =
  "כרגע אין רקעים זמינים ליצירת שלט. ניתן לחזור ולנסות שוב בהמשך.";

export function findCustomerBackground(
  catalog: SignBackground[],
  id: string | null | undefined,
): SignBackground | undefined {
  if (!id) {
    return undefined;
  }
  return catalog.find((bg) => bg.id === id);
}

export function resolveSyncedBackgroundSelection(
  current: string | null,
  catalog: SignBackground[],
): string | null {
  if (catalog.length === 0) {
    return null;
  }
  if (current && catalog.some((bg) => bg.id === current)) {
    return current;
  }
  if (catalog.length === 1) {
    return catalog[0]!.id;
  }
  return null;
}

export function isBackgroundSelectionValid(
  backgroundId: string | null,
  catalog: SignBackground[],
): boolean {
  if (!backgroundId) {
    return false;
  }
  return catalog.some((bg) => bg.id === backgroundId);
}
