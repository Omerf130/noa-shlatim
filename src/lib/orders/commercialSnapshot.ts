import { z } from "zod";
import type { Material } from "@/types/signDesign";

export const orderCommercialSnapshotSchema = z.object({
  currency: z.literal("ILS"),
  capturedAt: z.string().trim().min(1),
  material: z.enum(["wood", "magnet"]),
  productAmountMinor: z.number().int().min(0),
  shippingMethodId: z.string().trim().min(1).max(64),
  shippingLabel: z.string().trim().min(1).max(200),
  shippingAmountMinor: z.number().int().min(0),
  totalAmountMinor: z.number().int().min(0),
  magnetSizeId: z.string().trim().min(1).max(64).optional(),
  magnetSizeName: z.string().trim().max(80).optional(),
  magnetSizeDimensionsLabel: z.string().trim().max(80).optional(),
});

export type OrderCommercialSnapshot = z.infer<typeof orderCommercialSnapshotSchema>;

export function materialLabelForSnapshot(material: Material): string {
  return material === "wood" ? "עץ" : material === "magnet" ? "מגנט" : "—";
}

export function productDescriptionForSnapshot(
  snapshot: OrderCommercialSnapshot,
): string {
  if (snapshot.material === "magnet" && snapshot.magnetSizeName?.trim()) {
    const name = snapshot.magnetSizeName.trim();
    const dims = snapshot.magnetSizeDimensionsLabel?.trim();
    if (dims) {
      return `שלט מגנט - ${name} - ${dims}`;
    }
    return `שלט מגנט - ${name}`;
  }
  const materialLabel = materialLabelForSnapshot(snapshot.material);
  return `שלט לדלת בעיצוב אישי — ${materialLabel}`;
}
