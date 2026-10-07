import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runPostPaidOrderSideEffects } from "@/lib/orders/runPostPaidOrderSideEffects";

describe("runPostPaidOrderSideEffects", () => {
  it("runs finbot failure does not prevent owner notification", async () => {
    let notifyCalled = false;
    await runPostPaidOrderSideEffects("order-1", {
      finbot: async () => {
        throw new Error("finbot down");
      },
      ownerNotification: async () => {
        notifyCalled = true;
      },
    });
    assert.equal(notifyCalled, true);
  });

  it("runs owner notification failure does not prevent finbot attempt", async () => {
    let finbotCalled = false;
    await runPostPaidOrderSideEffects("order-1", {
      finbot: async () => {
        finbotCalled = true;
      },
      ownerNotification: async () => {
        throw new Error("resend down");
      },
    });
    assert.equal(finbotCalled, true);
  });
});
