import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { parseCheckoutPatchBody } from "@/lib/checkout/checkoutPatchSchema";
import {
  parseShippingAddress,
  validateShippingAddressFields,
} from "@/lib/checkout/shippingAddressSchema";
import { parsePersistedShippingAddress } from "@/lib/orders/formatShippingAddress";
import { validatePersistedShippingAddress } from "@/lib/orders/validatePersistedShippingAddress";

const validAddress = {
  city: "תל אביב",
  street: "דיזengoff",
  houseNumber: "12א",
  floor: "3",
  postalCode: "0123456",
};

describe("shippingAddressSchema", () => {
  it("accepts valid address with Hebrew house number and optional floor", () => {
    const parsed = parseShippingAddress(validAddress);
    assert.ok(parsed);
    assert.equal(parsed!.houseNumber, "12א");
    assert.equal(parsed!.floor, "3");
  });

  it("accepts missing optional floor", () => {
    const parsed = parseShippingAddress({
      ...validAddress,
      floor: "",
    });
    assert.ok(parsed);
    assert.equal(parsed!.floor, undefined);
  });

  it("preserves leading zeros in postal code", () => {
    const parsed = parseShippingAddress({
      ...validAddress,
      postalCode: "0012345",
    });
    assert.ok(parsed);
    assert.equal(parsed!.postalCode, "0012345");
  });

  it("rejects postal code that is not exactly 7 digits", () => {
    assert.equal(parseShippingAddress({ ...validAddress, postalCode: "123456" }), null);
    assert.equal(parseShippingAddress({ ...validAddress, postalCode: "12345678" }), null);
    assert.equal(parseShippingAddress({ ...validAddress, postalCode: "12345ab" }), null);
  });

  it("trims whitespace on postal code before validation", () => {
    const parsed = parseShippingAddress({
      ...validAddress,
      postalCode: " 0123456 ",
    });
    assert.ok(parsed);
    assert.equal(parsed!.postalCode, "0123456");
  });

  it("returns Hebrew field errors for client validation", () => {
    const errors = validateShippingAddressFields({
      city: "",
      street: "א",
      houseNumber: "",
      floor: "",
      postalCode: "123",
    });
    assert.ok(errors.city);
    assert.ok(errors.street);
    assert.ok(errors.houseNumber);
    assert.ok(errors.postalCode);
    assert.match(errors.postalCode!, /7 ספרות/);
  });
});

describe("checkout PATCH includes shippingAddress", () => {
  it("parses and persists shipping in patch schema", () => {
    const parsed = parseCheckoutPatchBody({
      customer: {
        fullName: "ישראל ישראלי",
        phone: "0501234567",
        email: "a@example.com",
      },
      notes: "",
      selectedShippingMethodId: "home",
      shippingAddress: validAddress,
    });
    assert.ok(parsed);
    assert.equal(parsed!.shippingAddress.postalCode, validAddress.postalCode);
  });

  it("checkout route sets shippingAddress on order", () => {
    const route = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../app/api/orders/[orderId]/checkout/route.ts",
      ),
      "utf8",
    );
    assert.match(route, /shippingAddress:/);
  });
});

describe("payment readiness requires shipping address", () => {
  it("initiateOrderPayment validates persisted shipping", () => {
    const src = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../orders/initiateOrderPayment.ts",
      ),
      "utf8",
    );
    assert.match(src, /validatePersistedShippingAddress/);
  });

  it("historical orders without address do not validate", () => {
    assert.equal(validatePersistedShippingAddress(undefined), false);
    assert.equal(validatePersistedShippingAddress(null), false);
    assert.equal(parsePersistedShippingAddress({ city: "x" }), null);
  });
});

describe("admin and owner email rendering", () => {
  it("admin detail dto includes shippingAddress", () => {
    const dtoSrc = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../admin/orders/adminOrderDtos.ts",
      ),
      "utf8",
    );
    assert.match(dtoSrc, /shippingAddress:/);
    assert.match(dtoSrc, /parsePersistedShippingAddress/);
  });

  it("owner email includes shipping block", () => {
    const emailSrc = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../notifications/buildOwnerPaidOrderEmail.ts",
      ),
      "utf8",
    );
    assert.match(emailSrc, /כתובת למשלוח/);
  });
});
