import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { isAdminVisibleOrderDocument } from "@/lib/admin/orders/adminOrderVisibility";
import { buildAdminOrderListItemDto } from "@/lib/admin/orders/adminOrderDtos";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");

const minimalDesign = {
  creationMode: "illustration" as const,
  backgroundId: "bg-1",
  text: { value: "שלום", fontId: "font-1", color: "#000", align: "center" as const },
  illustrationTransform: { x: 0, y: 0, scale: 1, rotation: 0 },
  decorations: [],
  material: "wood" as const,
  illustrationAssetId: "asset-1",
};

const lineA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const lineB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("admin order detail visibility regression", () => {
  it("11: items[]-only Cart order is visible for detail", () => {
    const order = {
      status: "draft",
      items: [
        {
          lineId: lineA,
          quantity: 1,
          creationMode: "illustration" as const,
          design: minimalDesign,
          assets: {},
        },
      ],
    };
    assert.equal(isAdminVisibleOrderDocument(order), true);
  });

  it("12: multi-item order resolves multiple lines for list/detail", () => {
    const order = {
      status: "payment_pending",
      items: [
        {
          lineId: lineA,
          quantity: 2,
          creationMode: "illustration" as const,
          design: minimalDesign,
          assets: {},
        },
        {
          lineId: lineB,
          quantity: 1,
          creationMode: "photo" as const,
          design: {
            ...minimalDesign,
            creationMode: "photo" as const,
            photoIllustrationStyleId: "watercolor-soft",
          },
          assets: {},
        },
      ],
    };
    assert.equal(isAdminVisibleOrderDocument(order), true);
    const listItem = buildAdminOrderListItemDto({
      _id: { toString: () => "507f1f77bcf86cd799439011" },
      ...order,
      createdAt: new Date(),
    });
    assert.ok(listItem);
    assert.match(listItem!.productSummaryLabel ?? "", /2 סוגי שלטים/);
  });

  it("13: legacy top-level order remains visible", () => {
    const order = {
      status: "draft",
      creationMode: "illustration" as const,
      design: minimalDesign,
      assets: {
        finalArtwork: {
          pathname: "orders/x/artwork.png",
          contentType: "image/png",
          sizeBytes: 1,
        },
      },
    };
    assert.equal(isAdminVisibleOrderDocument(order), true);
  });

  it("14: empty order remains rejected", () => {
    assert.equal(isAdminVisibleOrderDocument({ status: "draft" }), false);
    assert.equal(
      isAdminVisibleOrderDocument({ status: "draft", items: [] }),
      false,
    );
  });

  it("15-16: detail loader uses shared visibility helper", () => {
    const detailLoader = readFileSync(
      join(repoRoot, "src/lib/admin/orders/getAdminOrderDetail.ts"),
      "utf8",
    );
    assert.match(detailLoader, /isAdminVisibleOrderDocument/);
    assert.doesNotMatch(detailLoader, /mode !== "photo"/);
    const adminLayout = readFileSync(
      join(repoRoot, "src/app/admin/(protected)/layout.tsx"),
      "utf8",
    );
    assert.match(adminLayout, /requireAdminSession/);
  });
});
