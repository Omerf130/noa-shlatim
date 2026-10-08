import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appendSupportReference,
  supportReferenceSuffix,
} from "@/lib/diagnostics/supportReference";

describe("supportReference", () => {
  it("uses last 8 hex chars for search suffix", () => {
    const traceId = "aaaaaaaa-bbbb-4ccc-8ddd-123456789abc";
    assert.equal(supportReferenceSuffix(traceId), "56789ABC");
  });

  it("appends support line to user message", () => {
    const msg = appendSupportReference("שגיאה", "aaaaaaaa-bbbb-4ccc-8ddd-123456789abc");
    assert.match(msg, /קוד תמיכה: 56789ABC/);
  });
});
