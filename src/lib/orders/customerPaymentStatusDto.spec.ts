import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCustomerPaymentStatusDto } from "@/lib/orders/customerPaymentStatusDto";
import type { AuthorizedCheckoutOrder } from "@/lib/checkout/authorizeCheckoutAccess";

describe("customerPaymentStatusDto", () => {
  it("exposes only safe fields", () => {
    const auth: AuthorizedCheckoutOrder = {
      orderId: "507f1f77bcf86cd799439011",
      accessMode: "view",
      order: {
        status: "payment_pending",
        creationMode: "photo",
        design: {} as AuthorizedCheckoutOrder["order"]["design"],
        commercialSnapshot: {
          currency: "ILS",
          capturedAt: "2026-10-01T00:00:00.000Z",
          material: "wood",
          productAmountMinor: 9000,
          shippingMethodId: "pickup",
          shippingLabel: "איסוף",
          shippingAmountMinor: 0,
          totalAmountMinor: 9000,
        },
        payment: {
          activeAttemptId: null,
          attempts: [
            {
              attemptId: "a",
              status: "failed",
              createdAt: "2026-10-01T00:00:00.000Z",
              payplusTransactionUid: "secret-should-not-leak",
              paymentPageLink: "https://example.com/pay",
            },
          ],
        },
      },
    };

    const dto = buildCustomerPaymentStatusDto(auth);
    assert.equal(dto.ok, true);
    assert.equal(dto.status, "payment_pending");
    assert.equal(typeof dto.canRetryPayment, "boolean");
    assert.equal(dto.orderReference, "#99439011");
    assert.equal(JSON.stringify(dto).includes("payplusTransactionUid"), false);
    assert.equal(JSON.stringify(dto).includes("paymentPageLink"), false);
    assert.equal(JSON.stringify(dto).includes("commercialSnapshot"), false);
  });
});
