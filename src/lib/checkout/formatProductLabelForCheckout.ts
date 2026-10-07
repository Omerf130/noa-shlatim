import type { Material } from "@/types/signDesign";

export function formatCheckoutProductLabel(params: {
  material: Material;
  magnetSizeName?: string | null;
  magnetSizeDimensionsLabel?: string | null;
}): string {
  if (params.material === "wood") {
    return "שלט עץ";
  }
  const name = params.magnetSizeName?.trim();
  if (!name) {
    return "שלט מגנט";
  }
  const dims = params.magnetSizeDimensionsLabel?.trim();
  if (dims) {
    return `שלט מגנט · ${name} · ${dims}`;
  }
  return `שלט מגנט · ${name}`;
}
