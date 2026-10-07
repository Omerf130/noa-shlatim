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
      cardNumber: "1234",
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
});
