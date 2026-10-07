import type { OrderCommercialSnapshot } from "@/lib/orders/commercialSnapshot";
import { materialLabelForSnapshot } from "@/lib/orders/commercialSnapshot";
import { ISRAEL_STANDARD_VAT_RATE } from "@/lib/finbot/vatRate";

export type FinbotIncomeLineItem = {
  name: string;
  amount: number;
  price: number;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Gross ILS (2 decimals) implied by Finbot pre-VAT unit price with vatType true. */
export function finbotGrossIlsFromPreVatUnitPrice(
  unitPriceBeforeVat: number,
  vatRate: number,
  quantity = 1,
): number {
  const net = unitPriceBeforeVat * quantity;
  return round2(net * (1 + vatRate));
}

type GrossLinePart = {
  name: string;
  grossMinor: number;
};

function buildPreVatLinesFromGrossParts(
  parts: GrossLinePart[],
  totalGrossMinor: number,
  vatRate: number,
): FinbotIncomeLineItem[] {
  if (parts.length === 0 || totalGrossMinor <= 0) {
    throw new Error("FINBOT_VAT_ROUNDING_MISMATCH");
  }

  const totalNetMinor = Math.round(totalGrossMinor / (1 + vatRate));
  let allocatedNetMinor = 0;

  const lines: FinbotIncomeLineItem[] = parts.map((part, index) => {
    let netMinor: number;
    if (index === parts.length - 1) {
      netMinor = totalNetMinor - allocatedNetMinor;
    } else {
      netMinor = Math.round((totalNetMinor * part.grossMinor) / totalGrossMinor);
      allocatedNetMinor += netMinor;
    }
    return {
      name: part.name,
      amount: 1,
      price: round2(netMinor / 100),
    };
  });

  const targetGrossIls = round2(totalGrossMinor / 100);

  function sumGross(candidate: FinbotIncomeLineItem[]): number {
    return round2(
      candidate.reduce(
        (sum, line) => sum + finbotGrossIlsFromPreVatUnitPrice(line.price, vatRate, line.amount),
        0,
      ),
    );
  }

  if (sumGross(lines) === targetGrossIls) {
    return lines;
  }

  const maxDeltaCents = 500;
  for (let d0 = -maxDeltaCents; d0 <= maxDeltaCents; d0++) {
    for (let d1 = -maxDeltaCents; d1 <= maxDeltaCents; d1++) {
      const adjusted = lines.map((line, index) => {
        const deltaCents = index === 0 ? d0 : index === 1 ? d1 : 0;
        return { ...line, price: round2(line.price + deltaCents / 100) };
      });
      if (sumGross(adjusted) === targetGrossIls) {
        return adjusted;
      }
    }
  }

  throw new Error("FINBOT_VAT_ROUNDING_MISMATCH");
}

/**
 * Build Finbot line items from frozen snapshot. Pre-VAT unit prices; gross total matches snapshot.
 */
export function buildFinbotIncomeLineItems(
  snapshot: OrderCommercialSnapshot,
  vatRate: number = ISRAEL_STANDARD_VAT_RATE,
): FinbotIncomeLineItem[] {
  const materialLabel = materialLabelForSnapshot(snapshot.material);
  const parts: GrossLinePart[] = [
    {
      name: `שלט לדלת בעיצוב אישי — ${materialLabel}`,
      grossMinor: snapshot.productAmountMinor,
    },
  ];

  if (snapshot.shippingAmountMinor > 0) {
    parts.push({
      name: snapshot.shippingLabel.trim(),
      grossMinor: snapshot.shippingAmountMinor,
    });
  }

  if (snapshot.totalAmountMinor !== parts.reduce((s, p) => s + p.grossMinor, 0)) {
    throw new Error("FINBOT_SNAPSHOT_TOTAL_MISMATCH");
  }

  return buildPreVatLinesFromGrossParts(parts, snapshot.totalAmountMinor, vatRate);
}

export function finbotPaymentSumIlsFromSnapshot(snapshot: OrderCommercialSnapshot): number {
  return round2(snapshot.totalAmountMinor / 100);
}
