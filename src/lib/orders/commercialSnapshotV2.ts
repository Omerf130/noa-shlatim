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

export const commercialSnapshotPromotionAppliedSchema = z.object({
  promotionId: z.string().trim().min(1).max(128),
  internalName: z.string().trim().min(1).max(200),
  customerLabel: z.string().trim().min(1).max(200),
  applicationCount: z.number().int().min(1).max(20),
  savingsMinor: z.number().int().min(0),
});

export type CommercialSnapshotPromotionApplied = z.infer<
  typeof commercialSnapshotPromotionAppliedSchema
>;

export const orderCommercialSnapshotV2Schema = z
  .object({
    version: z.literal(2),
    currency: z.literal("ILS"),
    capturedAt: z.string().trim().min(1),
    lines: z.array(commercialSnapshotV2LineSchema).min(1),
    /** Catalog product subtotal (sum of line totals before promotions). */
    productAmountMinor: z.number().int().min(0),
    discountAmountMinor: z.number().int().min(0).optional(),
    promotionsApplied: z.array(commercialSnapshotPromotionAppliedSchema).optional(),
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
    const discount = snap.discountAmountMinor ?? 0;
    if (discount > snap.productAmountMinor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "discount exceeds product subtotal",
        path: ["discountAmountMinor"],
      });
    }
    const promotions = snap.promotionsApplied ?? [];
    if (promotions.length > 0) {
      let savingsSum = 0;
      for (let i = 0; i < promotions.length; i++) {
        savingsSum += promotions[i]!.savingsMinor;
      }
      if (savingsSum !== discount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "promotion savings mismatch",
          path: ["promotionsApplied"],
        });
      }
    }
    const expectedTotal =
      snap.productAmountMinor - discount + snap.shippingAmountMinor;
    if (expectedTotal !== snap.totalAmountMinor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "order total mismatch",
        path: ["totalAmountMinor"],
      });
    }
  });

export type OrderCommercialSnapshotV2 = z.infer<typeof orderCommercialSnapshotV2Schema>;
