import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildAdminOrderListItemDto } from "@/lib/admin/orders/adminOrderDtos";
import {
  isAdminOrderAssetAccessAllowed,
  isAdminOrderAssetType,
  resolveAdminOrderArtworkThumbnailApiPath,
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

  it("thumbnail API path for legacy order artwork", () => {
    const orderId = "507f1f77bcf86cd799439011";
    const url = resolveAdminOrderArtworkThumbnailApiPath(orderId, {
      creationMode: "photo",
      design: photoDesign,
      assets: {
        finalArtwork: {
          pathname: "orders/x/artwork.png",
          contentType: "image/png",
          sizeBytes: 1,
        },
      },
    });
    assert.equal(url, `/api/admin/orders/${orderId}/assets/artwork`);
  });

  it("thumbnail API path for first multi-item line artwork", () => {
    const orderId = "507f1f77bcf86cd799439012";
    const lineId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const url = resolveAdminOrderArtworkThumbnailApiPath(orderId, {
      items: [
        {
          lineId,
          quantity: 1,
          creationMode: "illustration",
          design: {
            ...photoDesign,
            creationMode: "illustration" as const,
            illustrationAssetId: "asset-1",
          },
          assets: {
            finalArtwork: {
              pathname: `orders/${orderId}/items/${lineId}/artwork.png`,
              contentType: "image/png",
              sizeBytes: 1,
            },
          },
        },
      ],
    });
    assert.equal(
      url,
      `/api/admin/orders/${orderId}/items/${lineId}/assets/artwork`,
    );
  });

  it("list DTO exposes same thumbnail URL for cart order", () => {
    const orderId = "507f1f77bcf86cd799439012";
    const lineId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const dto = buildAdminOrderListItemDto({
      _id: { toString: () => orderId },
      status: "draft",
      items: [
        {
          lineId,
          quantity: 1,
          creationMode: "illustration",
          design: {
            creationMode: "illustration",
            material: "magnet",
            backgroundId: "classic-white",
            illustrationAssetId: "asset-1",
            text: { value: "שלום", fontId: "assistant", color: "#000", align: "center" },
            decorations: [],
            illustrationTransform: { x: 0, y: 0, scale: 1, rotation: 0 },
          },
          assets: {
            finalArtwork: {
              pathname: `orders/${orderId}/items/${lineId}/artwork.png`,
              contentType: "image/png",
              sizeBytes: 1,
            },
          },
        },
      ],
      createdAt: new Date(),
    });
    assert.ok(dto?.artworkThumbnailUrl?.includes(`/items/${lineId}/assets/artwork`));
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
