import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  commercialSnapshotDisplayLines,
  commercialSnapshotGrossParts,
  commercialSnapshotTotalMinor,
  parseOrderCommercialSnapshot,
} from "@/lib/orders/commercialSnapshotAccess";
import { computeCheckoutTotals } from "@/lib/checkout/computeCheckoutTotals";
import { orderCommercialSnapshotV2Schema } from "@/lib/orders/commercialSnapshotV2";

const lineA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function sampleV2(overrides?: Partial<{ product: number; shipping: number }>) {
  const unit = 5000;
  const qty = 2;
  const lineTotal = unit * qty;
  const product = overrides?.product ?? lineTotal + 3000;
  const shipping = overrides?.shipping ?? 500;
  const total = product + shipping;
  return {
    version: 2 as const,
    currency: "ILS" as const,
    capturedAt: "2026-10-07T12:00:00.000Z",
    lines: [
      {
        lineId: lineA,
        quantity: qty,
        material: "magnet" as const,
        magnetSizeId: "m1",
        magnetSizeName: "20×30",
        magnetSizeDimensionsLabel: "20×30 ס״מ",
        unitPriceMinor: unit,
        lineTotalMinor: lineTotal,
        description: "שלט מגנט · 20×30 · 20×30 ס״מ",
      },
      {
        lineId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        quantity: 1,
        material: "wood" as const,
        unitPriceMinor: 3000,
        lineTotalMinor: 3000,
        description: "שלט עץ",
      },
    ],
    productAmountMinor: product,
    shippingMethodId: "ship1",
    shippingLabel: "שליח",
    shippingAmountMinor: shipping,
    totalAmountMinor: total,
  };
}

describe("commercialSnapshot v2 schema", () => {
  it("accepts valid multi-line snapshot", () => {
    const snap = sampleV2();
    assert.equal(orderCommercialSnapshotV2Schema.safeParse(snap).success, true);
  });

  it("rejects line total mismatch", () => {
    const snap = sampleV2();
    snap.lines[0]!.lineTotalMinor = 1;
    assert.equal(orderCommercialSnapshotV2Schema.safeParse(snap).success, false);
  });

  it("rejects order total mismatch", () => {
    const snap = sampleV2();
    snap.totalAmountMinor = 1;
    assert.equal(orderCommercialSnapshotV2Schema.safeParse(snap).success, false);
  });
});

describe("commercialSnapshot parser", () => {
  it("parses v1 without version field", () => {
    const parsed = parseOrderCommercialSnapshot({
      currency: "ILS",
      capturedAt: "2026-01-01T00:00:00.000Z",
      material: "wood",
      productAmountMinor: 9000,
      shippingMethodId: "s",
      shippingLabel: "שליח",
      shippingAmountMinor: 0,
      totalAmountMinor: 9000,
    });
    assert.equal(parsed?.version, 1);
  });

  it("parses v2", () => {
    const parsed = parseOrderCommercialSnapshot(sampleV2());
    assert.equal(parsed?.version, 2);
    assert.equal(parsed && commercialSnapshotTotalMinor(parsed), 13500);
  });

  it("v1 display synthesizes one line", () => {
    const parsed = parseOrderCommercialSnapshot({
      currency: "ILS",
      capturedAt: "2026-01-01T00:00:00.000Z",
      material: "wood",
      productAmountMinor: 9000,
      shippingMethodId: "s",
      shippingLabel: "שליח",
      shippingAmountMinor: 0,
      totalAmountMinor: 9000,
    });
    assert.ok(parsed);
    const lines = commercialSnapshotDisplayLines(parsed!);
    assert.equal(lines.length, 1);
    assert.equal(lines[0]!.quantity, 1);
  });

  it("gross parts sum to total", () => {
    const parsed = parseOrderCommercialSnapshot(sampleV2())!;
    const parts = commercialSnapshotGrossParts(parsed);
    const sum = parts.reduce((s, p) => s + p.grossMinor, 0);
    assert.equal(sum, commercialSnapshotTotalMinor(parsed));
  });
});

describe("checkout totals integer math", () => {
  it("product + shipping = total", () => {
    const t = computeCheckoutTotals(13000, 500);
    assert.equal(t.ok, true);
    if (t.ok) {
      assert.equal(t.totalAmountMinor, 13500);
    }
  });
});
