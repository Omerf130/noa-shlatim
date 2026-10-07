import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adminOrderDetailUrl } from "@/lib/site/siteUrl";

describe("adminOrderDetailUrl", () => {
  it("builds admin order URL from SITE_URL", () => {
    const prev = process.env.SITE_URL;
    process.env.SITE_URL = "https://www.noa-sign.co.il/";
    try {
      assert.equal(
        adminOrderDetailUrl("507f1f77bcf86cd799439011"),
        "https://www.noa-sign.co.il/admin/orders/507f1f77bcf86cd799439011",
      );
    } finally {
      if (prev === undefined) {
        delete process.env.SITE_URL;
      } else {
        process.env.SITE_URL = prev;
      }
    }
  });
});
