import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PayPlusGenerateLinkRequestBody } from "@/lib/payplus/buildGenerateLinkRequest";
import { generatePayPlusPaymentLink } from "@/lib/payplus/generatePaymentLink";
import type { PayPlusConfig } from "@/lib/payplus/env";

const config: PayPlusConfig = {
  apiKey: "test-api-key",
  secretKey: "test-secret-key",
  paymentPageUid: "page-uid",
  apiBaseUrl: "https://restapi.example.test/api/v1.0",
  siteUrl: "https://www.noa-sign.co.il",
};

const body = {} as PayPlusGenerateLinkRequestBody;

describe("generatePayPlusPaymentLink", () => {
  it("uses mocked fetch and never calls production host in tests", async () => {
    let requestedUrl = "";
    const fetchFn: typeof fetch = async (input) => {
      requestedUrl = String(input);
      return new Response(
        JSON.stringify({
          results: { status: "success", code: 0 },
          data: {
            page_request_uid: "uid-1",
            payment_page_link: "https://payments.example.test/uid-1",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    };

    const result = await generatePayPlusPaymentLink({ config, body, fetchFn });
    assert.equal(result.ok, true);
    assert.match(requestedUrl, /restapi\.example\.test/);
    assert.doesNotMatch(requestedUrl, /payplus\.co\.il/);
  });
});
