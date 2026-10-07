import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseTransactionViewCard } from "@/lib/payplus/fetchTransactionView";

describe("parseTransactionViewCard", () => {
  it("parses valid last-four and installments from View response", () => {
    const card = parseTransactionViewCard({
      data: [
        {
          transaction: {
            payments: { number_of_payments: 1 },
          },
          data: {
            card_information: { four_digits: "3712" },
          },
        },
      ],
    });
    assert.deepEqual(card, {
      payplusCardLastFourDigits: "3712",
      payplusNumberOfPayments: 1,
    });
  });

  it("returns null when fields missing or invalid", () => {
    assert.equal(parseTransactionViewCard({ data: [] }), null);
    assert.equal(
      parseTransactionViewCard({
        data: [
          {
            transaction: { payments: { number_of_payments: 1 } },
            data: { card_information: { four_digits: "12" } },
          },
        ],
      }),
      null,
    );
  });
});
