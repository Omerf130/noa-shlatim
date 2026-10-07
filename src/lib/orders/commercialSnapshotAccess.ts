import {
  orderCommercialSnapshotSchema,
  type OrderCommercialSnapshot,
  productDescriptionForSnapshot,
} from "@/lib/orders/commercialSnapshot";
import {
  orderCommercialSnapshotV2Schema,
  type OrderCommercialSnapshotV2,
  type CommercialSnapshotV2Line,
} from "@/lib/orders/commercialSnapshotV2";
import { LEGACY_ORDER_LINE_ID } from "@/lib/orders/orderItemConstants";

export type ParsedCommercialSnapshot =
  | { version: 1; snapshot: OrderCommercialSnapshot }
  | { version: 2; snapshot: OrderCommercialSnapshotV2 };

export function parseOrderCommercialSnapshot(
  raw: unknown,
): ParsedCommercialSnapshot | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const record = raw as Record<string, unknown>;
  if (record.version === 2) {
    const v2 = orderCommercialSnapshotV2Schema.safeParse(raw);
    return v2.success ? { version: 2, snapshot: v2.data } : null;
  }
  const v1 = orderCommercialSnapshotSchema.safeParse(raw);
  return v1.success ? { version: 1, snapshot: v1.data } : null;
}

export function hasValidCommercialSnapshot(raw: unknown): boolean {
  return parseOrderCommercialSnapshot(raw) !== null;
}

export function commercialSnapshotTotalMinor(parsed: ParsedCommercialSnapshot): number {
  return parsed.snapshot.totalAmountMinor;
}

export function commercialSnapshotProductMinor(parsed: ParsedCommercialSnapshot): number {
  return parsed.snapshot.productAmountMinor;
}

export function commercialSnapshotCurrency(parsed: ParsedCommercialSnapshot): "ILS" {
  return parsed.snapshot.currency;
}

export type CommercialDisplayLine = {
  lineId: string;
  quantity: number;
  description: string;
  unitPriceMinor: number;
  lineTotalMinor: number;
  material: "wood" | "magnet";
  magnetSizeName: string | null;
  magnetSizeDimensionsLabel: string | null;
};

export function commercialSnapshotDisplayLines(
  parsed: ParsedCommercialSnapshot,
): CommercialDisplayLine[] {
  if (parsed.version === 2) {
    return parsed.snapshot.lines.map((line) => ({
      lineId: line.lineId,
      quantity: line.quantity,
      description: line.description,
      unitPriceMinor: line.unitPriceMinor,
      lineTotalMinor: line.lineTotalMinor,
      material: line.material,
      magnetSizeName: line.magnetSizeName?.trim() || null,
      magnetSizeDimensionsLabel: line.magnetSizeDimensionsLabel?.trim() || null,
    }));
  }

  const s = parsed.snapshot;
  return [
    {
      lineId: LEGACY_ORDER_LINE_ID,
      quantity: 1,
      description: productDescriptionForSnapshot(s),
      unitPriceMinor: s.productAmountMinor,
      lineTotalMinor: s.productAmountMinor,
      material: s.material,
      magnetSizeName: s.magnetSizeName?.trim() || null,
      magnetSizeDimensionsLabel: s.magnetSizeDimensionsLabel?.trim() || null,
    },
  ];
}

export function commercialSnapshotShipping(parsed: ParsedCommercialSnapshot): {
  methodId: string;
  label: string;
  amountMinor: number;
} {
  const s = parsed.snapshot;
  return {
    methodId: s.shippingMethodId,
    label: s.shippingLabel,
    amountMinor: s.shippingAmountMinor,
  };
}

/** Finbot / gross allocation parts from frozen snapshot. */
export function commercialSnapshotGrossParts(parsed: ParsedCommercialSnapshot): Array<{
  name: string;
  grossMinor: number;
  quantity: number;
}> {
  const lines = commercialSnapshotDisplayLines(parsed).map((line) => ({
    name: line.description,
    grossMinor: line.lineTotalMinor,
    quantity: line.quantity,
  }));
  const shipping = commercialSnapshotShipping(parsed);
  if (shipping.amountMinor > 0) {
    lines.push({
      name: shipping.label.trim(),
      grossMinor: shipping.amountMinor,
      quantity: 1,
    });
  }
  return lines;
}

export function assertCommercialSnapshotInvariant(parsed: ParsedCommercialSnapshot): void {
  const total = commercialSnapshotTotalMinor(parsed);
  const parts = commercialSnapshotGrossParts(parsed);
  const sum = parts.reduce((s, p) => s + p.grossMinor, 0);
  if (sum !== total) {
    throw new Error("COMMERCIAL_SNAPSHOT_TOTAL_MISMATCH");
  }
}

export function isCommercialSnapshotV2(raw: unknown): raw is OrderCommercialSnapshotV2 {
  return orderCommercialSnapshotV2Schema.safeParse(raw).success;
}

export type { CommercialSnapshotV2Line, OrderCommercialSnapshotV2 };
