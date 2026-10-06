import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeCheckoutPaymentUiState } from "@/lib/orders/checkoutPaymentReturnState";

const snapshot = {
  currency: "ILS" as const,
  capturedAt: "2026-10-01T00:00:00.000Z",
  material: "wood" as const,
  productAmountMinor: 9000,
  shippingMethodId: "pickup",
  shippingLabel: "איסוף",
  shippingAmountMinor: 0,
  totalAmountMinor: 9000,
};

describe("checkout payment return UI state", () => {
  it("paid never offers retry", () => {
    const ui = computeCheckoutPaymentUiState({
      orderStatus: "paid",
      commercialSnapshot: snapshot,
      payment: { activeAttemptId: null, attempts: [] },
    });
    assert.equal(ui.status, "paid");
    assert.equal(ui.canRetryPayment, false);
  });

  it("payment_pending with ready attempt is not retryable (uncertain)", () => {
    const ui = computeCheckoutPaymentUiState({
      orderStatus: "payment_pending",
      commercialSnapshot: snapshot,
      payment: {
        activeAttemptId: "a",
        attempts: [
          {
            attemptId: "a",
            status: "ready",
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });
    assert.equal(ui.canRetryPayment, false);
  });

  it("payment_pending with failed attempt allows retry", () => {
    const ui = computeCheckoutPaymentUiState({
      orderStatus: "payment_pending",
      commercialSnapshot: snapshot,
      payment: {
        activeAttemptId: null,
        attempts: [
          {
            attemptId: "a",
            status: "failed",
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });
    assert.equal(ui.canRetryPayment, true);
  });

  it("outcome=success does not change server status (still payment_pending)", () => {
    const ui = computeCheckoutPaymentUiState({
      orderStatus: "payment_pending",
      commercialSnapshot: snapshot,
      payment: {
        activeAttemptId: "a",
        attempts: [
          {
            attemptId: "a",
            status: "ready",
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });
    assert.equal(ui.status, "payment_pending");
    assert.equal(ui.canRetryPayment, false);
  });
});
