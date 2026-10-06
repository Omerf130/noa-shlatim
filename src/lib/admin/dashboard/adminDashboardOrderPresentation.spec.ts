import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  adminDashboardPaymentStatus,
  adminDashboardWorkflowStatus,
} from "@/lib/admin/dashboard/adminDashboardOrderPresentation";

describe("adminDashboardPaymentStatus", () => {
  it("maps paid with check", () => {
    const p = adminDashboardPaymentStatus("paid");
    assert.equal(p.label, "שולם");
    assert.equal(p.showCheck, true);
  });

  it("maps payment_pending with clock", () => {
    const p = adminDashboardPaymentStatus("payment_pending");
    assert.equal(p.label, "ממתין");
    assert.equal(p.showClock, true);
  });
});

describe("adminDashboardWorkflowStatus", () => {
  it("maps paid to new-order workflow label", () => {
    assert.equal(adminDashboardWorkflowStatus("paid").label, "חדשה");
  });

  it("maps draft truthfully", () => {
    assert.equal(adminDashboardWorkflowStatus("draft").label, "טיוטה");
  });
});
