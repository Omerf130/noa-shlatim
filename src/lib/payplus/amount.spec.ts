import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  orderMinorToPayPlusAmount,
  payPlusAmountToOrderMinor,
} from "@/lib/payplus/amount";

describe("payplus amount boundary", () => {
  it("converts agorot to major ILS for PayPlus", () => {
    assert.equal(orderMinorToPayPlusAmount(100), 1);
    assert.equal(orderMinorToPayPlusAmount(150), 1.5);
    assert.equal(orderMinorToPayPlusAmount(0), 0);
  });

  it("rejects invalid minor input", () => {
    assert.throws(() => orderMinorToPayPlusAmount(-1), /INVALID_MINOR/);
    assert.throws(() => orderMinorToPayPlusAmount(1.5), /INVALID_MINOR/);
  });

  it("converts PayPlus major amount back to agorot", () => {
    assert.deepEqual(payPlusAmountToOrderMinor(1), { ok: true, minor: 100 });
    assert.deepEqual(payPlusAmountToOrderMinor(1.5), { ok: true, minor: 150 });
  });

  it("rejects non-integer major mappings", () => {
    assert.deepEqual(payPlusAmountToOrderMinor(1.005), {
      ok: false,
      reason: "NON_INTEGER_MAJOR",
    });
  });
});
