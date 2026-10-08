import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PhotoOrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";
import {
  ADD_TO_CART_API_PATH,
  buildAddToCartJsonBody,
} from "@/lib/cart/buildAddToCartJsonBody";

const designPayload: PhotoOrderDesignSnapshot = {
  creationMode: "photo",
  backgroundId: "classic-white",
  photoIllustrationStyleId: "style-soft",
  material: "wood",
  text: {
    value: "שלום",
    color: { kind: "solid", hex: "#112233" },
    size: 24,
    position: "center",
    fontStyle: "clean",
    offsetX: 0,
    offsetY: 0,
  },
  illustrationTransform: { x: 0.5, y: 0.5, scale: 1 },
  decorations: [],
};

const addKey = "11111111-1111-4111-8111-111111111111";
const stagingToken = "staging-token-value-min-length";

describe("buildAddToCartJsonBody", () => {
  it("uses cart items API path", () => {
    assert.equal(ADD_TO_CART_API_PATH, "/api/cart/items");
  });

  it("serializes design, idempotency key, and staging token", () => {
    const raw = buildAddToCartJsonBody({
      design: designPayload,
      addIdempotencyKey: addKey,
      signAssetStagingToken: stagingToken,
    });
    const parsed = JSON.parse(raw) as {
      design: PhotoOrderDesignSnapshot;
      addIdempotencyKey: string;
      signAssetStagingToken: string;
    };
    assert.deepEqual(parsed.design, designPayload);
    assert.equal(parsed.addIdempotencyKey, addKey);
    assert.equal(parsed.signAssetStagingToken, stagingToken);
  });
});
