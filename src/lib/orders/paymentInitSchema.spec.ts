import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePaymentInitBody } from "@/lib/orders/paymentInitSchema";

describe("paymentInitBodySchema", () => {
  it("accepts only termsAccepted true", () => {
    assert.deepEqual(parsePaymentInitBody({ termsAccepted: true }), {
      termsAccepted: true,
    });
  });

  it("rejects extra fields and false terms", () => {
    assert.equal(parsePaymentInitBody({ termsAccepted: false }), null);
    assert.equal(
      parsePaymentInitBody({ termsAccepted: true, termsVersion: "x" }),
      null,
    );
  });
});
