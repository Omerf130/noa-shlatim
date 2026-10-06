import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyPayPlusCallbackDecisionToFixture,
  decidePayPlusCallback,
} from "@/lib/orders/decidePayPlusCallback";
import type { OrderForPayPlusCallback } from "@/lib/orders/payPlusCallbackTypes";
import type { PayPlusCallbackPayload } from "@/lib/payplus/parseCallbackPayload";
import { computePayPlusRequestHash } from "@/lib/payplus/verifyPayPlusRequestHash";

const ORDER_ID = "507f1f77bcf86cd799439011";
const ATTEMPT_A = "11111111-1111-4111-8111-111111111111";
const ATTEMPT_B = "22222222-2222-4222-8222-222222222222";
const PAGE_UID_A = "ef76432c-769a-43a6-ba7a-6f70272539d8";
const TX_UID = "dcb11c1e7-a1231-37cf-6311-f5111eeb69c7";
const TX_UID_OTHER = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function baseOrder(overrides?: Partial<OrderForPayPlusCallback>): OrderForPayPlusCallback {
  return {
    orderId: ORDER_ID,
    status: "payment_pending",
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
      activeAttemptId: ATTEMPT_A,
      attempts: [
        {
          attemptId: ATTEMPT_A,
          status: "ready",
          createdAt: "2026-10-01T00:00:00.000Z",
          pageRequestUid: PAGE_UID_A,
        },
      ],
    },
    ...overrides,
  };
}

function payload(params: {
  statusCode?: string;
  amount?: number;
  currency?: string;
  attemptId?: string;
  txUid?: string;
  pageUid?: string;
}): PayPlusCallbackPayload {
  return {
    transactionType: "Charge",
    transaction: {
      uid: params.txUid ?? TX_UID,
      payment_request_uid: params.pageUid ?? PAGE_UID_A,
      status_code: params.statusCode ?? "000",
      amount: params.amount ?? 90,
      currency: params.currency ?? "ILS",
      more_info: ORDER_ID,
      more_info_2: params.attemptId ?? ATTEMPT_A,
    },
  };
}

describe("decidePayPlusCallback", () => {
  it("A: valid successful callback → mark_paid", () => {
    const decision = decidePayPlusCallback(baseOrder(), payload({}));
    assert.equal(decision.kind, "mark_paid");
    const applied = applyPayPlusCallbackDecisionToFixture(
      baseOrder(),
      decision,
      "2026-10-01T01:00:00.000Z",
    );
    assert.equal(applied.status, "paid");
    assert.equal(applied.payment?.attempts?.[0]?.status, "succeeded");
  });

  it("B: duplicate same transaction on succeeded attempt → idempotent", () => {
    const order = baseOrder({
      status: "paid",
      payment: {
        activeAttemptId: null,
        attempts: [
          {
            attemptId: ATTEMPT_A,
            status: "succeeded",
            createdAt: "2026-10-01T00:00:00.000Z",
            pageRequestUid: PAGE_UID_A,
            payplusTransactionUid: TX_UID,
            statusCode: "000",
          },
        ],
      },
    });
    const decision = decidePayPlusCallback(order, payload({}));
    assert.equal(decision.kind, "idempotent_ok");
  });

  it("C: invalid hash is tested in verifyPayPlusRequestHash.spec", () => {
    const raw = JSON.stringify({ x: 1 });
    const hash = computePayPlusRequestHash(raw, "wrong-secret");
    assert.notEqual(hash, computePayPlusRequestHash(raw, "right-secret"));
  });

  it("D: wrong amount → reject", () => {
    const decision = decidePayPlusCallback(baseOrder(), payload({ amount: 1 }));
    assert.equal(decision.kind, "reject");
    if (decision.kind === "reject") {
      assert.equal(decision.reason, "AMOUNT_MISMATCH");
    }
  });

  it("E: wrong currency → reject", () => {
    const decision = decidePayPlusCallback(baseOrder(), payload({ currency: "USD" }));
    assert.equal(decision.kind, "reject");
    if (decision.kind === "reject") {
      assert.equal(decision.reason, "CURRENCY_MISMATCH");
    }
  });

  it("F: wrong attempt correlation → reject", () => {
    const decision = decidePayPlusCallback(
      baseOrder(),
      payload({ attemptId: "00000000-0000-4000-8000-000000000099" }),
    );
    assert.equal(decision.kind, "reject");
  });

  it("G: failed verified payment → mark_failed, order stays payment_pending", () => {
    const decision = decidePayPlusCallback(baseOrder(), payload({ statusCode: "003" }));
    assert.equal(decision.kind, "mark_failed");
    const applied = applyPayPlusCallbackDecisionToFixture(
      baseOrder(),
      decision,
      "2026-10-01T01:00:00.000Z",
    );
    assert.equal(applied.status, "payment_pending");
    assert.equal(applied.payment?.attempts?.[0]?.status, "failed");
    assert.equal(applied.payment?.activeAttemptId, null);
  });

  it("H: late success for older failed attempt while order payment_pending", () => {
    const order = baseOrder({
      payment: {
        activeAttemptId: ATTEMPT_B,
        attempts: [
          {
            attemptId: ATTEMPT_A,
            status: "failed",
            createdAt: "2026-10-01T00:00:00.000Z",
            pageRequestUid: PAGE_UID_A,
          },
          {
            attemptId: ATTEMPT_B,
            status: "ready",
            createdAt: "2026-10-01T00:05:00.000Z",
            pageRequestUid: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          },
        ],
      },
    });
    const decision = decidePayPlusCallback(order, payload({ attemptId: ATTEMPT_A }));
    assert.equal(decision.kind, "mark_paid");
    const applied = applyPayPlusCallbackDecisionToFixture(
      order,
      decision,
      "2026-10-01T01:00:00.000Z",
    );
    assert.equal(applied.status, "paid");
    assert.equal(
      applied.payment?.attempts?.find((a) => a.attemptId === ATTEMPT_A)?.status,
      "succeeded",
    );
  });

  it("I: callback after paid — same tx idempotent, different success conflicts", () => {
    const order = baseOrder({
      status: "paid",
      payment: {
        activeAttemptId: null,
        attempts: [
          {
            attemptId: ATTEMPT_A,
            status: "succeeded",
            createdAt: "2026-10-01T00:00:00.000Z",
            payplusTransactionUid: TX_UID,
            statusCode: "000",
          },
        ],
      },
    });
    assert.equal(decidePayPlusCallback(order, payload({ txUid: TX_UID })).kind, "idempotent_ok");
    const orderWithRetry = baseOrder({
      status: "paid",
      payment: {
        activeAttemptId: null,
        attempts: [
          {
            attemptId: ATTEMPT_A,
            status: "succeeded",
            createdAt: "2026-10-01T00:00:00.000Z",
            payplusTransactionUid: TX_UID,
            statusCode: "000",
          },
          {
            attemptId: ATTEMPT_B,
            status: "failed",
            createdAt: "2026-10-01T00:05:00.000Z",
            pageRequestUid: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
          },
        ],
      },
    });
    const conflict = decidePayPlusCallback(
      orderWithRetry,
      payload({ txUid: TX_UID_OTHER, attemptId: ATTEMPT_B, pageUid: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }),
    );
    assert.equal(conflict.kind, "conflicting_paid_success");
  });

  it("J: malformed payload shape is tested in parseCallbackPayload.spec", () => {
    assert.equal(decidePayPlusCallback(null, payload({})).kind, "reject");
  });

  it("rejects page_request_uid mismatch when attempt has stored uid", () => {
    const decision = decidePayPlusCallback(
      baseOrder(),
      payload({ pageUid: "00000000-0000-4000-8000-000000000099" }),
    );
    assert.equal(decision.kind, "reject");
    if (decision.kind === "reject") {
      assert.equal(decision.reason, "CORRELATION_PAGE_REQUEST_UID");
    }
  });
});
