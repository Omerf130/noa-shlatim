import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildAdminDashboardGreeting } from "@/lib/admin/dashboard/adminDashboardGreeting";

describe("buildAdminDashboardGreeting", () => {
  it("uses morning greeting for Israel morning hours", () => {
    const { greeting } = buildAdminDashboardGreeting(new Date("2026-10-06T06:30:00+03:00"));
    assert.equal(greeting, "בוקר טוב");
  });

  it("uses afternoon greeting for Israel midday", () => {
    const { greeting } = buildAdminDashboardGreeting(new Date("2026-10-06T14:00:00+03:00"));
    assert.equal(greeting, "צהריים טובים");
  });

  it("uses evening greeting for Israel evening", () => {
    const { greeting } = buildAdminDashboardGreeting(new Date("2026-10-06T19:00:00+03:00"));
    assert.equal(greeting, "ערב טוב");
  });

  it("uses night greeting for late Israel hours", () => {
    const { greeting } = buildAdminDashboardGreeting(new Date("2026-10-06T23:00:00+03:00"));
    assert.equal(greeting, "לילה טוב");
  });

  it("includes Hebrew long date label", () => {
    const { dateLabel } = buildAdminDashboardGreeting(new Date("2026-10-06T12:00:00+03:00"));
    assert.match(dateLabel, /2026/);
    assert.match(dateLabel, /אוקטובר|October|6|ו/);
  });
});
