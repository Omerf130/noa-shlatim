import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BackgroundNotAvailableError } from "@/lib/backgrounds/loadBackgrounds";
import { OrderError } from "@/lib/orders/errors";
import type { OrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";
import {
  validateDesignForPurchase,
  validateDesignProductAvailability,
} from "@/lib/orders/validateDesignForPurchase";

const magnetSizeId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

const woodPhotoDesign: OrderDesignSnapshot = {
  creationMode: "photo",
  backgroundId: "classic-white",
  material: "wood",
  photoIllustrationStyleId: "style-soft",
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

const magnetIllustrationDesign: OrderDesignSnapshot = {
  creationMode: "illustration",
  backgroundId: "classic-white",
  material: "magnet",
  magnetSizeId,
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

const enabledPricing = {
  woodEnabled: true,
  magnetEnabled: true,
  woodPriceMinor: 10_000,
  magnetPriceMinor: 5_000,
  magnetSizes: [
    {
      id: magnetSizeId,
      name: "מגנט",
      dimensionsLabel: "10×10",
      priceMinor: 6_900,
      enabled: true,
      sortOrder: 0,
    },
  ],
};

describe("validateDesignProductAvailability", () => {
  it("accepts enabled wood without magnetSizeId", () => {
    assert.doesNotThrow(() =>
      validateDesignProductAvailability(woodPhotoDesign, enabledPricing),
    );
  });

  it("rejects wood with magnetSizeId", () => {
    assert.throws(
      () =>
        validateDesignProductAvailability(
          { ...woodPhotoDesign, magnetSizeId: magnetSizeId },
          enabledPricing,
        ),
      (err: unknown) =>
        err instanceof OrderError && err.code === "INVALID_DESIGN",
    );
  });

  it("rejects disabled material", () => {
    assert.throws(
      () =>
        validateDesignProductAvailability(woodPhotoDesign, {
          ...enabledPricing,
          woodEnabled: false,
        }),
      (err: unknown) =>
        err instanceof OrderError && err.code === "MATERIAL_UNAVAILABLE",
    );
  });

  it("rejects magnet without magnetSizeId", () => {
    const noSize: OrderDesignSnapshot = {
      ...magnetIllustrationDesign,
      magnetSizeId: undefined,
    };
    assert.throws(
      () => validateDesignProductAvailability(noSize, enabledPricing),
      (err: unknown) =>
        err instanceof OrderError && err.code === "INVALID_DESIGN",
    );
  });

  it("rejects disabled magnet size", () => {
    assert.throws(
      () =>
        validateDesignProductAvailability(magnetIllustrationDesign, {
          ...enabledPricing,
          magnetSizes: [{ ...enabledPricing.magnetSizes![0]!, enabled: false }],
        }),
      (err: unknown) =>
        err instanceof OrderError && err.code === "MAGNET_SIZE_UNAVAILABLE",
    );
  });

  it("rejects unknown magnetSizeId", () => {
    assert.throws(
      () =>
        validateDesignProductAvailability(
          { ...magnetIllustrationDesign, magnetSizeId: "00000000-0000-4000-8000-000000000099" },
          enabledPricing,
        ),
      (err: unknown) =>
        err instanceof OrderError && err.code === "MAGNET_SIZE_UNAVAILABLE",
    );
  });
});

describe("validateDesignForPurchase — background", () => {
  it("rejects unavailable background", async () => {
    await assert.rejects(
      () =>
        validateDesignForPurchase(woodPhotoDesign, {
          pricingInput: enabledPricing,
          assertBackgroundEnabled: async () => {
            throw new BackgroundNotAvailableError();
          },
        }),
      (err: unknown) =>
        err instanceof OrderError && err.code === "BACKGROUND_UNAVAILABLE",
    );
  });

  it("passes when background check succeeds", async () => {
    await validateDesignForPurchase(woodPhotoDesign, {
      pricingInput: enabledPricing,
      assertBackgroundEnabled: async () => {},
    });
  });
});
