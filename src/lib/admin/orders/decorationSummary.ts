import { getSignDecorationById } from "@/data/signDecorations";
import type { PhotoOrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";

export function formatDecorationSummary(
  decorations: PhotoOrderDesignSnapshot["decorations"],
): string {
  if (decorations.length === 0) {
    return "ללא קישוטים";
  }
  const labels = decorations.map((d) => getSignDecorationById(d.type).label);
  return `${decorations.length} קישוטים: ${labels.join(", ")}`;
}
