import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sendOwnerPaidOrderNotification } from "@/lib/notifications/sendOwnerPaidOrderNotification";
import type { PaymentAttemptRecord } from "@/lib/orders/paymentAttemptStatus";

describe("sendOwnerPaidOrderNotification (mocked Resend)", () => {
  it("skips when claim not acquired (already sent)", async () => {
    let sendCalled = false;
    const result = await sendOwnerPaidOrderNotification({
      orderId: "507f1f77bcf86cd799439011",
      resendSendFn: async () => {
        sendCalled = true;
        return { ok: true };
      },
      _testDeps: {
        getConfig: () => ({ apiKey: "key", ownerEmail: "owner@example.com" }),
        claim: async () => ({ ok: true, claimed: false, reason: "sent" as const }),
      },
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.outcome, "skipped");
    }
    assert.equal(sendCalled, false);
  });

  it("marks failed when Resend API fails and does not throw", async () => {
    const prevSite = process.env.SITE_URL;
    process.env.SITE_URL = "https://www.noa-sign.co.il";
    const marks: string[] = [];
    const result = await sendOwnerPaidOrderNotification({
      orderId: "507f1f77bcf86cd799439011",
      resendSendFn: async () => ({ ok: false, errorMessage: "Resend error" }),
      _testDeps: {
        getConfig: () => ({ apiKey: "key", ownerEmail: "owner@example.com" }),
        claim: async () => ({ ok: true, claimed: true, attemptCount: 1 }),
        loadPaidOrder: async () => ({
          status: "paid",
          customer: { fullName: "Test User", phone: "0501234567", email: "a@b.com" },
          commercialSnapshot: {
            currency: "ILS",
            capturedAt: "2026-10-01T00:00:00.000Z",
            material: "wood",
            productAmountMinor: 9000,
            shippingMethodId: "s",
            shippingLabel: "איסוף",
            shippingAmountMinor: 0,
            totalAmountMinor: 9000,
          },
          payment: {
            attempts: [
              {
                attemptId: "a",
                status: "succeeded",
                createdAt: "2026-10-07T09:00:00.000Z",
                completedAt: "2026-10-07T10:00:00.000Z",
              } satisfies PaymentAttemptRecord,
            ],
          },
        }),
        markFailed: async () => {
          marks.push("failed");
        },
        markSent: async () => {
          marks.push("sent");
        },
      },
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.outcome, "failed");
    }
    assert.deepEqual(marks, ["failed"]);
    if (prevSite === undefined) {
      delete process.env.SITE_URL;
    } else {
      process.env.SITE_URL = prevSite;
    }
  });

  it("marks sent on successful Resend send", async () => {
    const prevSite = process.env.SITE_URL;
    process.env.SITE_URL = "https://www.noa-sign.co.il";
    const marks: string[] = [];
    const result = await sendOwnerPaidOrderNotification({
      orderId: "507f1f77bcf86cd799439011",
      resendSendFn: async () => ({ ok: true }),
      _testDeps: {
        getConfig: () => ({ apiKey: "key", ownerEmail: "owner@example.com" }),
        claim: async () => ({ ok: true, claimed: true, attemptCount: 1 }),
        loadPaidOrder: async () => ({
          status: "paid",
          customer: { fullName: "Test User", phone: "0501234567", email: "a@b.com" },
          commercialSnapshot: {
            currency: "ILS",
            capturedAt: "2026-10-01T00:00:00.000Z",
            material: "wood",
            productAmountMinor: 9000,
            shippingMethodId: "s",
            shippingLabel: "איסוף",
            shippingAmountMinor: 0,
            totalAmountMinor: 9000,
          },
          payment: {
            attempts: [
              {
                attemptId: "a",
                status: "succeeded",
                createdAt: "2026-10-07T09:00:00.000Z",
                completedAt: "2026-10-07T10:00:00.000Z",
              } satisfies PaymentAttemptRecord,
            ],
          },
        }),
        markFailed: async () => {
          marks.push("failed");
        },
        markSent: async () => {
          marks.push("sent");
        },
      },
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.outcome, "sent");
    }
    assert.deepEqual(marks, ["sent"]);
    if (prevSite === undefined) {
      delete process.env.SITE_URL;
    } else {
      process.env.SITE_URL = prevSite;
    }
  });

  it("handles missing RESEND config without throwing", async () => {
    const result = await sendOwnerPaidOrderNotification({
      orderId: "507f1f77bcf86cd799439011",
      _testDeps: {
        getConfig: () => null,
        claim: async () => ({ ok: true, claimed: true, attemptCount: 1 }),
        markFailed: async () => {},
      },
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.outcome, "failed");
    }
  });
});
