import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isAdminOrderAssetAccessAllowed,
  isAdminOrderAssetType,
  resolveOrderItemAssetPathname,
} from "@/lib/admin/orders/adminOrderAssets";
import { LEGACY_ORDER_LINE_ID } from "@/lib/orders/orderItemConstants";

describe("admin order asset access", () => {
  const photoDesign = {
    creationMode: "photo" as const,
    material: "wood" as const,
    backgroundId: "classic-white",
    photoIllustrationStyleId: "watercolor-soft",
    text: { value: "שלום", fontId: "assistant", color: "#000", align: "center" as const },
    decorations: [],
  };

  it("allows draft", () => {
    assert.equal(
      isAdminOrderAssetAccessAllowed({
        status: "draft",
        creationMode: "photo",
        design: photoDesign,
      }),
      true,
    );
  });

  it("allows payment_pending", () => {
    assert.equal(
      isAdminOrderAssetAccessAllowed({
        status: "payment_pending",
        creationMode: "photo",
        design: photoDesign,
      }),
      true,
    );
  });

  it("allows paid", () => {
    assert.equal(
      isAdminOrderAssetAccessAllowed({
        status: "paid",
        creationMode: "photo",
        design: photoDesign,
      }),
      true,
    );
  });

  it("rejects creating", () => {
    assert.equal(
      isAdminOrderAssetAccessAllowed({
        status: "creating",
        creationMode: "photo",
        design: photoDesign,
      }),
      false,
    );
  });

  it("rejects order with no resolvable items", () => {
    assert.equal(
      isAdminOrderAssetAccessAllowed({ status: "draft", creationMode: "photo" }),
      false,
    );
  });

  it("rejects invalid asset type string", () => {
    assert.equal(isAdminOrderAssetType("thumbnail"), false);
    assert.equal(isAdminOrderAssetType("original"), true);
    assert.equal(isAdminOrderAssetType("artwork"), true);
  });

  it("returns null pathname when asset metadata missing", () => {
    assert.equal(
      resolveOrderItemAssetPathname(
        { creationMode: "photo", design: photoDesign },
        LEGACY_ORDER_LINE_ID,
        "artwork",
      ),
      null,
    );
  });

  it("resolves legacy pathname when asset metadata present", () => {
    const pathname = "orders/507f1f77bcf86cd799439011/artwork.png";
    assert.equal(
      resolveOrderItemAssetPathname(
        {
          creationMode: "photo",
          design: photoDesign,
          assets: {
            finalArtwork: {
              pathname,
              contentType: "image/png",
              sizeBytes: 1,
            },
          },
        },
        LEGACY_ORDER_LINE_ID,
        "artwork",
      ),
      pathname,
    );
  });
});
