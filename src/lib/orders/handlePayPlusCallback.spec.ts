import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PayPlusCallbackDecision } from "@/lib/orders/decidePayPlusCallback";

describe("handlePayPlusCallback finbot trigger policy", () => {
  function shouldTriggerFinbot(
    persisted: { ok: true; idempotent: boolean },
    decision: PayPlusCallbackDecision,
  ): boolean {
    return !persisted.idempotent && decision.kind === "mark_paid";
  }

  it("duplicate PayPlus callback does not trigger Finbot", () => {
    assert.equal(
      shouldTriggerFinbot({ ok: true, idempotent: true }, { kind: "idempotent_ok" }),
      false,
    );
  });

  it("new mark_paid triggers Finbot", () => {
    assert.equal(
      shouldTriggerFinbot(
        { ok: true, idempotent: false },
        {
          kind: "mark_paid",
          orderId: "507f1f77bcf86cd799439011",
          attemptId: "a",
          payplusTransactionUid: "tx",
          statusCode: "000",
        },
      ),
      true,
    );
  });
});
