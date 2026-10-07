import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateOwnerNotificationClaimSkip } from "@/lib/notifications/ownerNotificationClaimRules";
import { OWNER_NOTIFICATION_PENDING_STALE_MS } from "@/lib/orders/ownerPaidNotification";

describe("evaluateOwnerNotificationClaimSkip", () => {
  const nowMs = Date.parse("2026-10-07T12:00:00.000Z");

  it("sent skips permanently", () => {
    assert.equal(
      evaluateOwnerNotificationClaimSkip("paid", { status: "sent" }, nowMs),
      "sent",
    );
  });

  it("fresh pending skips", () => {
    assert.equal(
      evaluateOwnerNotificationClaimSkip(
        "paid",
        {
          status: "pending",
          lastAttemptAt: new Date(nowMs - 1000).toISOString(),
        },
        nowMs,
      ),
      "pending_fresh",
    );
  });

  it("failed is eligible for claim", () => {
    assert.equal(
      evaluateOwnerNotificationClaimSkip("paid", { status: "failed" }, nowMs),
      null,
    );
  });

  it("missing notification is eligible", () => {
    assert.equal(evaluateOwnerNotificationClaimSkip("paid", undefined, nowMs), null);
  });

  it("stale pending is eligible", () => {
    assert.equal(
      evaluateOwnerNotificationClaimSkip(
        "paid",
        {
          status: "pending",
          lastAttemptAt: new Date(nowMs - OWNER_NOTIFICATION_PENDING_STALE_MS - 1000).toISOString(),
        },
        nowMs,
      ),
      null,
    );
  });

  it("non-paid order skips", () => {
    assert.equal(
      evaluateOwnerNotificationClaimSkip("payment_pending", undefined, nowMs),
      "not_paid",
    );
  });
});
