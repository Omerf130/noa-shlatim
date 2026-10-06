import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPayPlusGenerateLinkRequest } from "@/lib/payplus/buildGenerateLinkRequest";
import type { OrderCommercialSnapshot } from "@/lib/orders/commercialSnapshot";

const snapshot: OrderCommercialSnapshot = {
  currency: "ILS",
  capturedAt: "2026-10-06T12:00:00.000Z",
  material: "wood",
  productAmountMinor: 9900,
  shippingMethodId: "ship-1",
  shippingLabel: "דואר",
  shippingAmountMinor: 1500,
  totalAmountMinor: 11400,
};

describe("buildPayPlusGenerateLinkRequest", () => {
  it("maps snapshot total to PayPlus amount and correlation fields", () => {
    const body = buildPayPlusGenerateLinkRequest({
      paymentPageUid: "page-uid",
      siteUrl: "https://www.noa-sign.co.il",
      orderId: "507f1f77bcf86cd799439011",
      attemptId: "attempt-uuid",
      snapshot,
      customer: {
        customer_name: "Test User",
        email: "test@example.com",
        phone: "0501234567",
      },
    });

    assert.equal(body.amount, 114);
    assert.equal(body.currency_code, "ILS");
    assert.equal(body.charge_method, 1);
    assert.equal(body.initial_invoice, false);
    assert.equal(body.sendEmailApproval, false);
    assert.equal(body.sendEmailFailure, false);
    assert.equal(body.more_info, "507f1f77bcf86cd799439011");
    assert.equal(body.more_info_2, "attempt-uuid");
    assert.equal(
      body.refURL_callback,
      "https://www.noa-sign.co.il/api/payplus/callback",
    );
    assert.match(body.refURL_success, /payment\/return\?outcome=success$/);
  });
});
