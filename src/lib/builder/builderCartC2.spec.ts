import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  builderReducer,
  initialBuilderState,
} from "@/lib/builder/builderReducer";
import { hasValidFinalSignArtwork } from "@/lib/builder/validation";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

describe("RESET_BUILDER_SESSION", () => {
  it("returns start step and clears final artwork validity", () => {
    const withArtwork = builderReducer(
      {
        ...initialBuilderState,
        ui: {
          ...initialBuilderState.ui,
          currentStepId: "review",
          finalSignArtwork: {
            status: "success",
            objectUrl: "blob:fake",
            isValid: true,
            previewMode: "final",
          },
        },
        design: {
          ...initialBuilderState.design,
          creationMode: "photo",
          text: { ...initialBuilderState.design.text, value: "נשאר" },
        },
      },
      { type: "RESET_BUILDER_SESSION" },
    );
    assert.equal(withArtwork.ui.currentStepId, "start");
    assert.equal(hasValidFinalSignArtwork(withArtwork.ui), false);
    assert.equal(withArtwork.design.text.value, initialBuilderState.design.text.value);
  });

  it("does not reference cart APIs", () => {
    const reducerSrc = readFileSync(
      join(repoRoot, "src/lib/builder/builderReducer.ts"),
      "utf8",
    );
    assert.doesNotMatch(reducerSrc, /\/api\/cart/);
  });
});

describe("ReviewStep wiring (C2)", () => {
  it("uses useAddToCart instead of useCreateDraftOrder", () => {
    const reviewSrc = readFileSync(
      join(repoRoot, "src/components/builder/steps/ReviewStep.tsx"),
      "utf8",
    );
    assert.match(reviewSrc, /useAddToCart/);
    assert.doesNotMatch(reviewSrc, /useCreateDraftOrder/);
    assert.doesNotMatch(reviewSrc, /להמשך להזמנה/);
    assert.match(reviewSrc, /הוספה לסל/);
    assert.match(reviewSrc, /יצירת שלט נוסף/);
    assert.match(reviewSrc, /מעבר לסל/);
    assert.doesNotMatch(reviewSrc, /router\.push/);
    assert.doesNotMatch(reviewSrc, /checkout/);
  });

  it("shows success state copy", () => {
    const reviewSrc = readFileSync(
      join(repoRoot, "src/components/builder/steps/ReviewStep.tsx"),
      "utf8",
    );
    assert.match(reviewSrc, /השלט נוסף לסל/);
    assert.match(reviewSrc, /role="status"/);
  });

  it("prevents double submit while loading", () => {
    const reviewSrc = readFileSync(
      join(repoRoot, "src/components/builder/steps/ReviewStep.tsx"),
      "utf8",
    );
    assert.match(reviewSrc, /isSubmitting/);
    assert.match(reviewSrc, /aria-busy/);
    assert.match(reviewSrc, /מוסיף לסל/);
  });
});

describe("C12 — direct Order creation removed", () => {
  it("does not ship useCreateDraftOrder hook", () => {
    const hookPath = join(repoRoot, "src/hooks/useCreateDraftOrder.ts");
    assert.throws(() => readFileSync(hookPath, "utf8"));
  });

  it("does not ship POST /api/orders/draft route", () => {
    const routePath = join(repoRoot, "src/app/api/orders/draft/route.ts");
    assert.throws(() => readFileSync(routePath, "utf8"));
  });
});

describe("useAddToCart hook", () => {
  it("posts to cart items endpoint", () => {
    const hookSrc = readFileSync(
      join(repoRoot, "src/hooks/useAddToCart.ts"),
      "utf8",
    );
    assert.match(hookSrc, /ADD_TO_CART_API_PATH/);
    assert.doesNotMatch(hookSrc, /router\.push/);
    assert.doesNotMatch(hookSrc, /\/api\/orders\/draft/);
    assert.match(hookSrc, /consumeAfterSuccess/);
    assert.match(hookSrc, /resetForNewSign/);
    assert.doesNotMatch(hookSrc, /\/api\/cart\/.*delete/i);
  });
});

describe("ReviewStep mobile layout", () => {
  it("keeps column actions on small screens", () => {
    const scss = readFileSync(
      join(repoRoot, "src/components/builder/steps/ReviewStep.module.scss"),
      "utf8",
    );
    assert.match(scss, /flex-direction: column/);
  });
});
