import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildOwnerPaidOrderEmail } from "@/lib/notifications/buildOwnerPaidOrderEmail";
import type { OrderCommercialSnapshot } from "@/lib/orders/commercialSnapshot";

const snapshot: OrderCommercialSnapshot = {
  currency: "ILS",
  capturedAt: "2026-10-01T00:00:00.000Z",
  material: "wood",
  productAmountMinor: 9000,
  shippingMethodId: "home",
  shippingLabel: "משלוח עד הבית",
  shippingAmountMinor: 0,
  totalAmountMinor: 9000,
};

describe("buildOwnerPaidOrderEmail", () => {
  it("includes order, customer, commercial fields and admin URL", () => {
    const adminOrderUrl = "https://www.noa-sign.co.il/admin/orders/507f1f77bcf86cd799439011";
    const email = buildOwnerPaidOrderEmail({
      orderId: "507f1f77bcf86cd799439011",
      customer: {
        fullName: "ישראל ישראלי",
        phone: "0501234567",
        email: "buyer@example.com",
      },
      snapshot,
      paymentCompletedAtIso: "2026-10-07T10:00:00.000Z",
      adminOrderUrl,
    });

    assert.equal(email.subject, "הזמנה חדשה התקבלה באתר 🎉");
    assert.match(email.html, /#99439011/);
    assert.match(email.text, /#99439011/);
    assert.match(email.html, /ישראל ישראלי/);
    assert.match(email.html, /0501234567/);
    assert.match(email.html, /buyer@example.com/);
    assert.match(email.html, /₪90/);
    assert.match(email.html, /עץ/);
    assert.match(email.html, /משלוח עד הבית/);
    assert.match(email.html, /צפייה בהזמנה/);
    assert.ok(email.html.includes(adminOrderUrl));
    assert.ok(email.text.includes(adminOrderUrl));
  });

  it("does not embed customer images or attachments", () => {
    const email = buildOwnerPaidOrderEmail({
      orderId: "507f1f77bcf86cd799439011",
      customer: {
        fullName: "Test",
        phone: "0501234567",
        email: "a@b.com",
      },
      snapshot,
      paymentCompletedAtIso: "2026-10-07T10:00:00.000Z",
      adminOrderUrl: "https://www.noa-sign.co.il/admin/orders/x",
    });

    assert.doesNotMatch(email.html, /<img\b/i);
    assert.doesNotMatch(email.html, /attachment/i);
  });
});
