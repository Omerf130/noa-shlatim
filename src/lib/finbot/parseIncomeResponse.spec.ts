import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseFinbotIncomeResponse } from "@/lib/finbot/parseIncomeResponse";

describe("parseFinbotIncomeResponse", () => {
  it("treats HTTP-style 200 with status !== 1 as failure", () => {
    const result = parseFinbotIncomeResponse({
      status: 0,
      message: "validation failed",
      errors: [{ code: 500, text: "סכום לא תואם" }],
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.failure.errorMessage, /500/);
    }
  });

  it("status === 1 stores document URL and document number", () => {
    const result = parseFinbotIncomeResponse({
      status: 1,
      message: "ok",
      data: "https://finbot.example/doc/123",
      documentNumber: "90191",
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.success.documentUrl, "https://finbot.example/doc/123");
      assert.equal(result.success.documentNumber, "90191");
    }
  });
});
