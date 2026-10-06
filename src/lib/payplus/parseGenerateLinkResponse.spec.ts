import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePayPlusGenerateLinkResponse } from "@/lib/payplus/parseGenerateLinkResponse";

describe("parsePayPlusGenerateLinkResponse", () => {
  it("accepts success payload", () => {
    const result = parsePayPlusGenerateLinkResponse(true, {
      results: { status: "success", code: 0 },
      data: {
        page_request_uid: "abc-123",
        payment_page_link: "https://payments.payplus.co.il/abc-123",
      },
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.pageRequestUid, "abc-123");
      assert.match(result.data.paymentPageLink, /^https:\/\//);
    }
  });

  it("rejects non-success API status", () => {
    const result = parsePayPlusGenerateLinkResponse(true, {
      results: { status: "error" },
    });
    assert.equal(result.ok, false);
  });
});
