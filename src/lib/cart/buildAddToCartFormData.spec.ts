import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PhotoOrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";
import {
  ADD_TO_CART_API_PATH,
  buildAddToCartFormData,
} from "@/lib/cart/buildAddToCartFormData";

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

describe("buildAddToCartFormData", () => {
  it("targets cart items API", () => {
    assert.equal(ADD_TO_CART_API_PATH, "/api/cart/items");
  });

  it("includes design JSON", () => {
    const form = buildAddToCartFormData({
      designPayload,
      addIdempotencyKey: addKey,
      originalFile: new File([new Uint8Array([1])], "photo.jpg", {
        type: "image/jpeg",
      }),
      finalArtworkBlob: new Blob([new Uint8Array([2])], { type: "image/png" }),
    });
    const designRaw = form.get("design");
    assert.equal(typeof designRaw, "string");
    assert.deepEqual(JSON.parse(designRaw as string), designPayload);
  });

  it("includes original image file", () => {
    const file = new File([new Uint8Array([1, 2])], "source.png", {
      type: "image/png",
    });
    const form = buildAddToCartFormData({
      designPayload,
      addIdempotencyKey: addKey,
      originalFile: file,
      finalArtworkBlob: new Blob([], { type: "image/png" }),
    });
    const original = form.get("originalImage");
    assert.ok(original instanceof File);
    assert.equal(original.name, "source.png");
  });

  it("includes final artwork blob as artwork.png", () => {
    const blob = new Blob([new Uint8Array([9])], { type: "image/png" });
    const form = buildAddToCartFormData({
      designPayload,
      addIdempotencyKey: addKey,
      originalFile: new File([], "x.jpg"),
      finalArtworkBlob: blob,
    });
    const artwork = form.get("finalArtwork");
    assert.ok(artwork instanceof File);
    assert.equal(artwork.name, "artwork.png");
  });

  it("includes addIdempotencyKey", () => {
    const form = buildAddToCartFormData({
      designPayload,
      addIdempotencyKey: addKey,
      originalFile: new File([], "x.jpg"),
      finalArtworkBlob: new Blob([], { type: "image/png" }),
    });
    assert.equal(form.get("addIdempotencyKey"), addKey);
  });
});
