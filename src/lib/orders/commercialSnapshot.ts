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
});

export type OrderCommercialSnapshot = z.infer<typeof orderCommercialSnapshotSchema>;

export function materialLabelForSnapshot(material: Material): string {
  return material === "wood" ? "עץ" : material === "magnet" ? "מגנט" : "—";
}
