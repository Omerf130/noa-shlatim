import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { cartNavAriaLabel } from "@/lib/cart/cartNavA11y";
import {
  buildCartSummaryDto,
  EMPTY_CART_SUMMARY,
  navbarBadgeQuantityFromSummary,
} from "@/lib/cart/cartSummary";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

describe("navbar badge quantity", () => {
  it("CASE 2: quantity 0 → no badge in UI logic", () => {
    assert.equal(navbarBadgeQuantityFromSummary(EMPTY_CART_SUMMARY), 0);
    const activeEmpty = buildCartSummaryDto({ status: "active", items: [] });
    assert.equal(activeEmpty.badgeQuantity, 0);
  });

  it("CASE 3: active cart quantity 1 → badge 1", () => {
    const summary = buildCartSummaryDto({
      status: "active",
      items: [{ quantity: 1 }],
    });
    assert.equal(summary.badgeQuantity, 1);
  });

  it("CASE 4: multiple lines sum totalQuantity for badge", () => {
    const summary = buildCartSummaryDto({
      status: "active",
      items: [{ quantity: 2 }, { quantity: 1 }],
    });
    assert.equal(summary.totalQuantity, 3);
    assert.equal(summary.badgeQuantity, 3);
  });

  it("CASE 5: converted cart does not produce active badge count", () => {
    const summary = buildCartSummaryDto({
      status: "converted",
      items: [{ quantity: 2 }, { quantity: 1 }],
    });
    assert.equal(summary.totalQuantity, 3);
    assert.equal(navbarBadgeQuantityFromSummary(summary), 0);
  });
});

describe("CartNavLink accessibility", () => {
  it("CASE 11: Hebrew accessible labels", () => {
    assert.equal(cartNavAriaLabel(0), "סל הקניות");
    assert.equal(cartNavAriaLabel(1), "סל הקניות, פריט אחד");
    assert.equal(cartNavAriaLabel(3), "סל הקניות, 3 פריטים");
  });
});

describe("Header cart navigation wiring", () => {
  it("CASE 1: cart icon links to /cart", () => {
    const header = readFileSync(
      join(repoRoot, "src/components/layout/Header/Header.tsx"),
      "utf8",
    );
    const nav = readFileSync(
      join(repoRoot, "src/components/cart/CartNavLink.tsx"),
      "utf8",
    );
    assert.match(header, /CartNavLink/);
    assert.match(nav, /href="\/cart"/);
    assert.match(nav, /ShoppingBag/);
  });

  it("CASE 6: add-to-cart hook updates badge count", () => {
    const hook = readFileSync(
      join(repoRoot, "src/hooks/useAddToCart.ts"),
      "utf8",
    );
    assert.match(hook, /setBadgeQuantity/);
    assert.match(hook, /totalQuantity/);
  });

  it("CASE 7-9: cart mutations update badge count", () => {
    const cart = readFileSync(
      join(repoRoot, "src/components/cart/CartPageClient.tsx"),
      "utf8",
    );
    assert.match(cart, /setBadgeQuantity/);
    assert.match(cart, /totalQuantity/);
  });

  it("CASE 10: server layout seeds initial badge from summary", () => {
    const layout = readFileSync(join(repoRoot, "src/app/layout.tsx"), "utf8");
    assert.match(layout, /getCartSummaryForRequest/);
    assert.match(layout, /CartCountProvider/);
    assert.match(layout, /initialBadgeQuantity/);
  });
});

describe("empty cart CTA unchanged", () => {
  it("CASE 12: empty state still links to /create", () => {
    const cart = readFileSync(
      join(repoRoot, "src/components/cart/CartPageClient.tsx"),
      "utf8",
    );
    assert.match(cart, /הסל שלך עדיין ריק/);
    assert.match(cart, /href="\/create"/);
  });
});
