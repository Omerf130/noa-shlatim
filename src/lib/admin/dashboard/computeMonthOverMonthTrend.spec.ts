import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeMonthOverMonthTrend } from "@/lib/admin/dashboard/computeMonthOverMonthTrend";

describe("computeMonthOverMonthTrend", () => {
  it("positive change", () => {
    const t = computeMonthOverMonthTrend(12, 10);
    assert.equal(t.variant, "positive");
    assert.equal(t.percentLabel, "+20%");
    assert.equal(t.showUpArrow, true);
  });

  it("negative change", () => {
    const t = computeMonthOverMonthTrend(8, 10);
    assert.equal(t.variant, "negative");
    assert.equal(t.percentLabel, "-20%");
    assert.equal(t.showDownArrow, true);
  });

  it("equal values", () => {
    const t = computeMonthOverMonthTrend(5, 5);
    assert.equal(t.variant, "neutral");
    assert.match(t.text, /אין שינוי/);
  });

  it("both zero", () => {
    const t = computeMonthOverMonthTrend(0, 0);
    assert.equal(t.variant, "neutral");
    assert.match(t.text, /אין שינוי/);
  });

  it("previous zero current positive", () => {
    const t = computeMonthOverMonthTrend(3, 0);
    assert.equal(t.variant, "positive");
    assert.equal(t.text, "עלייה מהחודש הקודם");
    assert.equal(t.percentLabel, undefined);
  });
});
