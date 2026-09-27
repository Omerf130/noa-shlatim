import { signTextSolidColors } from "@/data/signTextColors";
import type { DecorationTypeId } from "@/types/signDesign";

export type SignDecorationCatalogItem = {
  id: DecorationTypeId;
  label: string;
  defaultColor: string;
};

export const signDecorationCatalog: SignDecorationCatalogItem[] = [
  { id: "heart", label: "לב", defaultColor: "#c93345" },
  { id: "star", label: "כוכב", defaultColor: "#c89932" },
  { id: "paw", label: "כפה", defaultColor: "#6d5a4a" },
  { id: "leaf", label: "עלה", defaultColor: "#2d4a3e" },
  { id: "flower", label: "פרח", defaultColor: "#d4849a" },
  { id: "sparkle", label: "ניצוץ", defaultColor: "#c89932" },
  { id: "house", label: "בית", defaultColor: "#c46953" },
  { id: "sun", label: "שמש", defaultColor: "#e09530" },
];

/** Curated solids for decoration color UI — catalog defaults + shared text palette. */
export const signDecorationColorPalette: { hex: string; label: string }[] = (() => {
  const seen = new Set<string>();
  const out: { hex: string; label: string }[] = [];
  const add = (hex: string, label: string) => {
    const key = hex.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ hex, label });
  };
  for (const item of signDecorationCatalog) {
    add(item.defaultColor, item.label);
  }
  for (const c of signTextSolidColors) {
    add(c.hex, c.label);
  }
  add("#c93345", "אדום");
  add("#3d8b5a", "ירוק");
  add("#d4849a", "ורוד");
  add("#e09530", "כתום");
  return out;
})();

export function getSignDecorationById(id: DecorationTypeId): SignDecorationCatalogItem {
  const item = signDecorationCatalog.find((d) => d.id === id);
  if (!item) throw new Error(`Unknown decoration: ${id}`);
  return item;
}

export function defaultColorForDecorationType(type: DecorationTypeId): string {
  return getSignDecorationById(type).defaultColor;
}

export function resolveDecorationColor(
  decoration: { type: DecorationTypeId; color?: string },
): string {
  if (decoration.color) return decoration.color;
  return defaultColorForDecorationType(decoration.type);
}
