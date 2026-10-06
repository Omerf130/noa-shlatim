import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isPaymentInitRetryAllowed,
  isPendingLinkStale,
  type PaymentAttemptRecord,
} from "@/lib/orders/paymentAttemptStatus";

describe("payment attempt retry rules", () => {
  it("allows first init from draft when no active attempt", () => {
    assert.equal(
      isPaymentInitRetryAllowed({
        orderStatus: "draft",
        hasCommercialSnapshot: false,
        activeAttempt: null,
      }),
      true,
    );
  });

  it("allows retry from payment_pending when last attempt link_failed", () => {
    const active: PaymentAttemptRecord = {
      attemptId: "a",
      status: "link_failed",
      createdAt: new Date().toISOString(),
    };
    assert.equal(
      isPaymentInitRetryAllowed({
        orderStatus: "payment_pending",
        hasCommercialSnapshot: true,
        activeAttempt: active,
      }),
      true,
    );
  });

  it("blocks retry while ready attempt is active", () => {
    const active: PaymentAttemptRecord = {
      attemptId: "a",
      status: "ready",
      createdAt: new Date().toISOString(),
    };
    assert.equal(
      isPaymentInitRetryAllowed({
        orderStatus: "payment_pending",
        hasCommercialSnapshot: true,
        activeAttempt: active,
      }),
      false,
    );
  });

  it("detects stale pending_link", () => {
    const stale: PaymentAttemptRecord = {
      attemptId: "a",
      status: "pending_link",
      createdAt: new Date(Date.now() - 121_000).toISOString(),
    };
    assert.equal(isPendingLinkStale(stale, Date.now()), true);
  });
});
