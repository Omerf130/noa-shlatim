import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

describe("checkout save-and-pay regression", () => {
  it("1-3: single primary button reuses onSecurePayment without SSR canInitiatePayment gate", () => {
    const form = readFileSync(
      join(repoRoot, "src/components/checkout/CheckoutCustomerForm.tsx"),
      "utf8",
    );
    assert.match(form, /שמירה והמשך לתשלום/);
    assert.match(form, /void onSecurePayment\(\)/);
    assert.doesNotMatch(form, /canInitiatePayment &&/);
    assert.doesNotMatch(form, /!canInitiatePayment/);
    assert.doesNotMatch(form, /הפרטים נשמרו/);
    assert.doesNotMatch(form, /שמירת פרטים ומשלוח/);
    assert.doesNotMatch(form, /מעבר לתשלום מאובטח/);
  });

  it("4-6: PATCH then payment init in one flow", () => {
    const form = readFileSync(
      join(repoRoot, "src/components/checkout/CheckoutCustomerForm.tsx"),
      "utf8",
    );
    assert.match(form, /persistCheckoutDetails/);
    assert.match(form, /payment\/init/);
    assert.match(form, /window\.location\.assign\(initData\.paymentPageLink\)/);
    const initRoute = readFileSync(
      join(repoRoot, "src/app/api/orders/[orderId]/payment/init/route.ts"),
      "utf8",
    );
    assert.match(initRoute, /initiateOrderPayment/);
  });

  it("7-8: duplicate click and validation guards", () => {
    const form = readFileSync(
      join(repoRoot, "src/components/checkout/CheckoutCustomerForm.tsx"),
      "utf8",
    );
    assert.match(form, /paymentState === "processing"/);
    assert.match(form, /disabled=\{paymentBusy \|\| formDisabled\}/);
    assert.match(form, /CHECKOUT_TERMS_REQUIRED_MESSAGE/);
    assert.match(form, /CHECKOUT_SHIPPING_REQUIRED_MESSAGE/);
  });

  it("9: COMMERCIAL_TOTAL_CHANGED refreshes for reconfirmation", () => {
    const form = readFileSync(
      join(repoRoot, "src/components/checkout/CheckoutCustomerForm.tsx"),
      "utf8",
    );
    assert.match(form, /COMMERCIAL_TOTAL_CHANGED/);
    assert.match(form, /router\.refresh\(\)/);
    assert.match(form, /acknowledgedTotalAmountMinor/);
  });

  it("10: payment init route unchanged for freeze/retry semantics", () => {
    const initiate = readFileSync(
      join(repoRoot, "src/lib/orders/initiateOrderPayment.ts"),
      "utf8",
    );
    assert.match(initiate, /commercialSnapshot/);
    assert.match(initiate, /isPaymentInitRetryAllowed/);
  });
});
