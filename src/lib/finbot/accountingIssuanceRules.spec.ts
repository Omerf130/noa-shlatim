import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evaluateAccountingClaimSkip } from "@/lib/finbot/accountingIssuanceRules";
import { ACCOUNTING_PENDING_STALE_MS } from "@/lib/orders/accountingDocument";

describe("evaluateAccountingClaimSkip", () => {
  const nowMs = Date.parse("2026-10-07T12:00:00.000Z");

  it("issued cannot be re-issued", () => {
    assert.equal(
      evaluateAccountingClaimSkip("paid", { status: "issued" }, nowMs),
      "issued",
    );
  });

  it("fresh pending skips", () => {
    assert.equal(
      evaluateAccountingClaimSkip(
        "paid",
        { status: "pending", lastAttemptAt: new Date(nowMs - 1000).toISOString() },
        nowMs,
      ),
      "pending_fresh",
    );
  });

  it("failed is eligible (no skip)", () => {
    assert.equal(
      evaluateAccountingClaimSkip("paid", { status: "failed" }, nowMs),
      null,
    );
  });

  it("stale pending is eligible", () => {
    assert.equal(
      evaluateAccountingClaimSkip(
        "paid",
        {
          status: "pending",
          lastAttemptAt: new Date(nowMs - ACCOUNTING_PENDING_STALE_MS - 1000).toISOString(),
        },
        nowMs,
      ),
      null,
    );
  });

  it("uncertain is not automatically retried", () => {
    assert.equal(
      evaluateAccountingClaimSkip("paid", { status: "uncertain" }, nowMs),
      "uncertain",
    );
  });
});
