import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  checkClientDiagnosticReportRateLimit,
  resetClientDiagnosticReportRateLimitForTests,
} from "@/lib/diagnostics/clientReportRateLimit";

describe("client diagnostic report rate limit", () => {
  it("blocks excessive reports per minute", () => {
    resetClientDiagnosticReportRateLimitForTests();
    const key = "test-ip";
    assert.equal(checkClientDiagnosticReportRateLimit(key), true);
    assert.equal(checkClientDiagnosticReportRateLimit(key), true);
    assert.equal(checkClientDiagnosticReportRateLimit(key), true);
    assert.equal(checkClientDiagnosticReportRateLimit(key), false);
  });
});
