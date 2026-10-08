import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

describe("AI generation loader regression", () => {
  it("overlay uses playful messages and reduced motion", () => {
    const overlay = readFileSync(
      join(repoRoot, "src/components/builder/SignPreview/SignGenerationOverlay.tsx"),
      "utf8",
    );
    const scss = readFileSync(
      join(repoRoot, "src/components/builder/SignPreview/SignGenerationOverlay.module.scss"),
      "utf8",
    );
    assert.match(overlay, /נועה בודקת אם כולם יצאו פוטוגניים/);
    assert.match(overlay, /prefers-reduced-motion/);
    assert.match(overlay, /clearInterval/);
    assert.match(scss, /pawOrbit/);
    assert.match(scss, /prefers-reduced-motion: reduce/);
  });

  it("generation hook prevents duplicate requests", () => {
    const hook = readFileSync(
      join(repoRoot, "src/hooks/useFinalSignGeneration.ts"),
      "utf8",
    );
    assert.match(hook, /finalSignArtwork\.status === "generating"/);
    assert.match(hook, /FINAL_SIGN_START/);
  });

  it("overlay tied to generating state in composition editor", () => {
    const editor = readFileSync(
      join(repoRoot, "src/components/builder/SignPreview/SignCompositionEditor.tsx"),
      "utf8",
    );
    assert.match(editor, /SignGenerationOverlay/);
    assert.match(editor, /active=\{isGenerating\}/);
  });
});
