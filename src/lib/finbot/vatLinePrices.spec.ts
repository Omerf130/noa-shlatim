import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildFinbotIncomeLineItems,
  finbotGrossIlsFromPreVatUnitPrice,
  finbotPaymentSumIlsFromSnapshot,
} from "@/lib/finbot/vatLinePrices";
import type { OrderCommercialSnapshot } from "@/lib/orders/commercialSnapshot";

const baseSnapshot = (overrides?: Partial<OrderCommercialSnapshot>): OrderCommercialSnapshot => ({
  currency: "ILS",
  capturedAt: "2026-10-01T00:00:00.000Z",
  material: "wood",
  productAmountMinor: 9000,
  shippingMethodId: "pickup",
  shippingLabel: "איסוף",
  shippingAmountMinor: 0,
  totalAmountMinor: 9000,
  ...overrides,
});

describe("buildFinbotIncomeLineItems", () => {
  it("preserves exact final paid total for product-only order", () => {
    const snapshot = baseSnapshot();
    const lines = buildFinbotIncomeLineItems(snapshot);
    assert.equal(lines.length, 1);
    assert.match(lines[0]!.name, /שלט לדלת/);
    assert.match(lines[0]!.name, /עץ/);

    const implied = lines.reduce(
      (sum, line) => sum + finbotGrossIlsFromPreVatUnitPrice(line.price, 0.18, line.amount),
      0,
    );
    assert.equal(implied, finbotPaymentSumIlsFromSnapshot(snapshot));
  });

  it("adds shipping line when shipping amount > 0", () => {
    const snapshot = baseSnapshot({
      productAmountMinor: 8000,
      shippingAmountMinor: 1000,
      totalAmountMinor: 9000,
      shippingLabel: "משלוח עד הבית",
    });
    const lines = buildFinbotIncomeLineItems(snapshot);
    assert.equal(lines.length, 2);
    assert.equal(lines[1]!.name, "משלוח עד הבית");

    const implied = lines.reduce(
      (sum, line) => sum + finbotGrossIlsFromPreVatUnitPrice(line.price, 0.18, line.amount),
      0,
    );
    assert.equal(implied, 90);
  });
});
