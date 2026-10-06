import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computePaidRevenueMinorFromAggregation } from "@/lib/admin/dashboard/computePaidRevenueMinor";

describe("computePaidRevenueMinorFromAggregation", () => {
  it("returns 0 when facet is empty or missing", () => {
    assert.equal(computePaidRevenueMinorFromAggregation(undefined), 0);
    assert.equal(computePaidRevenueMinorFromAggregation([]), 0);
  });

  it("returns truncated non-negative sum from aggregation row", () => {
    assert.equal(
      computePaidRevenueMinorFromAggregation([{ _id: null, sum: 12345.9 }]),
      12345,
    );
  });

  it("clamps negative sums to 0", () => {
    assert.equal(
      computePaidRevenueMinorFromAggregation([{ _id: null, sum: -100 }]),
      0,
    );
  });

  it("returns 0 for non-finite sum", () => {
    assert.equal(
      computePaidRevenueMinorFromAggregation([{ _id: null, sum: Number.NaN }]),
      0,
    );
  });
});
