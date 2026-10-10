import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createFinbotIncomeDocument } from "@/lib/finbot/createIncomeDocument";
import type { FinbotIncomeRequestBody } from "@/lib/finbot/buildIncomeRequest";

const minimalBody: FinbotIncomeRequestBody = {
  type: "2",
  date: "07/10/2026",
  language: "he",
  currency: "ILS",
  rounding: true,
  vatType: true,
  title: "order:test",
  customer: { name: "A", email: "a@b.com", phone: "050", save: false },
  email: { to: "a@b.com" },
  items: [{ name: "item", amount: 1, price: 10, save: false }],
  payments: [
    {
      type: "2",
      date: "07/10/2026",
      sum: 10,
      cardNumber: 1234,
      numberPayments: 1,
      transactionNumber: "tx",
    },
  ],
};

describe("createFinbotIncomeDocument", () => {
  it("timeout becomes transport FINBOT_TIMEOUT", async () => {
    const result = await createFinbotIncomeDocument({
      config: { apiSecret: "secret", apiBaseUrl: "https://finbot.test" },
      body: minimalBody,
      fetchFn: async () => {
        const err = new Error("aborted");
        err.name = "AbortError";
        throw err;
      },
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.kind, "transport");
      assert.equal(result.errorMessage, "FINBOT_TIMEOUT");
    }
  });

  it("returns api_error with aggregated validation messages", async () => {
    const result = await createFinbotIncomeDocument({
      config: { apiSecret: "secret", apiBaseUrl: "https://finbot.test" },
      body: minimalBody,
      fetchFn: async () =>
        ({
          ok: true,
          json: async () => ({
            status: 0,
            errors: [
              { field: "cardNumber", code: 412, text: "card invalid" },
            ],
          }),
        }) as Response,
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.kind, "api_error");
      assert.equal(result.errorCode, "412");
      assert.match(result.errorMessage, /cardNumber/);
    }
  });

  it("returns document URL on success", async () => {
    const result = await createFinbotIncomeDocument({
      config: { apiSecret: "secret", apiBaseUrl: "https://finbot.test" },
      body: minimalBody,
      fetchFn: async () =>
        ({
          ok: true,
          json: async () => ({
            status: 1,
            data: "https://finbot.test/doc/1",
            documentNumber: "100",
          }),
        }) as Response,
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.documentUrl, "https://finbot.test/doc/1");
      assert.equal(result.documentNumber, "100");
    }
  });

  it("POST body serializes cardNumber as number", async () => {
    let postedBody = "";
    await createFinbotIncomeDocument({
      config: { apiSecret: "secret", apiBaseUrl: "https://finbot.test" },
      body: minimalBody,
      fetchFn: async (_url, init) => {
        postedBody = String(init?.body ?? "");
        return {
          ok: true,
          json: async () => ({ status: 1, data: "https://finbot.test/doc/2" }),
        } as Response;
      },
    });
    const parsed = JSON.parse(postedBody) as { payments: Array<{ cardNumber: unknown }> };
    assert.equal(typeof parsed.payments[0]!.cardNumber, "number");
  });
});
