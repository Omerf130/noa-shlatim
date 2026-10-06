import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isAdminOrderAssetAccessAllowed,
  isAdminOrderAssetType,
  resolveOrderAssetPathname,
} from "@/lib/admin/orders/adminOrderAssets";

describe("admin order asset access", () => {
  const photo = { creationMode: "photo" as const };

  it("allows draft", () => {
    assert.equal(
      isAdminOrderAssetAccessAllowed({ status: "draft", ...photo }),
      true,
    );
  });

  it("allows payment_pending", () => {
    assert.equal(
      isAdminOrderAssetAccessAllowed({ status: "payment_pending", ...photo }),
      true,
    );
  });

  it("allows paid", () => {
    assert.equal(
      isAdminOrderAssetAccessAllowed({ status: "paid", ...photo }),
      true,
    );
  });

  it("rejects creating", () => {
    assert.equal(
      isAdminOrderAssetAccessAllowed({ status: "creating", ...photo }),
      false,
    );
  });

  it("rejects invalid creation mode", () => {
    assert.equal(
      isAdminOrderAssetAccessAllowed({ status: "draft", creationMode: "unknown" }),
      false,
    );
  });

  it("rejects invalid asset type string", () => {
    assert.equal(isAdminOrderAssetType("thumbnail"), false);
    assert.equal(isAdminOrderAssetType("original"), true);
    assert.equal(isAdminOrderAssetType("artwork"), true);
  });

  it("returns null pathname when asset metadata missing", () => {
    assert.equal(resolveOrderAssetPathname({}, "artwork"), null);
    assert.equal(resolveOrderAssetPathname({ assets: {} }, "original"), null);
  });

  it("resolves pathname when asset metadata present", () => {
    const pathname = "orders/507f1f77bcf86cd799439011/artwork.png";
    assert.equal(
      resolveOrderAssetPathname(
        { assets: { finalArtwork: { pathname } } },
        "artwork",
      ),
      pathname,
    );
  });
});
