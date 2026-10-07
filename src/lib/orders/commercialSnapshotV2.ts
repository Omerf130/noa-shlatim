import { z } from "zod";

export const commercialSnapshotV2LineSchema = z.object({
  lineId: z.string().trim().min(1).max(128),
  quantity: z.number().int().min(1).max(20),
  material: z.enum(["wood", "magnet"]),
  magnetSizeId: z.string().trim().min(1).max(64).optional(),
  magnetSizeName: z.string().trim().max(80).optional(),
  magnetSizeDimensionsLabel: z.string().trim().max(80).optional(),
  unitPriceMinor: z.number().int().min(0),
  lineTotalMinor: z.number().int().min(0),
  description: z.string().trim().min(1).max(300),
});

export type CommercialSnapshotV2Line = z.infer<typeof commercialSnapshotV2LineSchema>;

export const orderCommercialSnapshotV2Schema = z
  .object({
    version: z.literal(2),
    currency: z.literal("ILS"),
    capturedAt: z.string().trim().min(1),
    lines: z.array(commercialSnapshotV2LineSchema).min(1),
    productAmountMinor: z.number().int().min(0),
    shippingMethodId: z.string().trim().min(1).max(64),
    shippingLabel: z.string().trim().min(1).max(200),
    shippingAmountMinor: z.number().int().min(0),
    totalAmountMinor: z.number().int().min(0),
  })
  .superRefine((snap, ctx) => {
    let productSum = 0;
    for (let i = 0; i < snap.lines.length; i++) {
      const line = snap.lines[i]!;
      if (line.lineTotalMinor !== line.unitPriceMinor * line.quantity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "line total mismatch",
          path: ["lines", i, "lineTotalMinor"],
        });
      }
      productSum += line.lineTotalMinor;
    }
    if (productSum !== snap.productAmountMinor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "product subtotal mismatch",
        path: ["productAmountMinor"],
      });
    }
    if (snap.productAmountMinor + snap.shippingAmountMinor !== snap.totalAmountMinor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "order total mismatch",
        path: ["totalAmountMinor"],
      });
    }
  });

export type OrderCommercialSnapshotV2 = z.infer<typeof orderCommercialSnapshotV2Schema>;
