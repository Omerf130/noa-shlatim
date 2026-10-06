import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import { LEGACY_BACKGROUND_SEEDS } from "@/lib/backgrounds/legacyBackgroundSeed";
import { readBackgroundImageBuffer } from "@/lib/backgrounds/readBackgroundImageBuffer";
import { getOpenAiImageConfig } from "@/lib/openai/config";
import { validateImageBuffer } from "@/lib/ai/validateUpload";
import { AiIllustrationError } from "@/lib/ai/errors";

describe("readBackgroundImageBuffer — public assets", () => {
  it("reads a legacy public background file", async () => {
    const seed = LEGACY_BACKGROUND_SEEDS[0]!;
    const result = await readBackgroundImageBuffer(
      {
        id: seed.id,
        displayName: seed.displayName,
        enabled: true,
        sortOrder: seed.sortOrder,
        imageSrc: seed.imageSrc,
        storageKind: "public",
        blobPathname: null,
        objectPosition: seed.objectPosition,
        alt: seed.alt,
      },
      getOpenAiImageConfig().maxUploadBytes,
    );
    assert.ok(result.buffer.length > 0);
    assert.match(result.mime, /^image\//);
  });

  it("rejects path traversal in public imageSrc", async () => {
    await assert.rejects(
      () =>
        readBackgroundImageBuffer(
          {
            id: "bad",
            displayName: "bad",
            enabled: true,
            sortOrder: 0,
            imageSrc: "/backgrounds/../package.json",
            storageKind: "public",
          },
          getOpenAiImageConfig().maxUploadBytes,
        ),
      (err: unknown) => err instanceof AiIllustrationError,
    );
  });
});

describe("readBackgroundImageBuffer — blob assets", () => {
  it("requires blobPathname for blob storage", async () => {
    await assert.rejects(
      () =>
        readBackgroundImageBuffer(
          {
            id: "bg-blob",
            displayName: "blob",
            enabled: true,
            sortOrder: 0,
            imageSrc: "/api/backgrounds/bg-blob/image",
            storageKind: "blob",
            blobPathname: null,
          },
          getOpenAiImageConfig().maxUploadBytes,
        ),
      (err: unknown) => err instanceof AiIllustrationError,
    );
  });
});

describe("validateImageBuffer — upload limits", () => {
  it("rejects oversize buffers", async () => {
    const seed = LEGACY_BACKGROUND_SEEDS[0]!;
    const relative = decodeURIComponent(seed.imageSrc.slice("/backgrounds/".length));
    const filePath = `public/backgrounds/${relative}`;
    const buffer = await readFile(filePath);
    await assert.rejects(
      () => validateImageBuffer(buffer, Math.max(1, buffer.length - 1)),
      (err: unknown) =>
        err instanceof AiIllustrationError &&
        (err as AiIllustrationError).code === "IMAGE_TOO_LARGE",
    );
  });

  it("rejects non-image bytes", async () => {
    await assert.rejects(
      () => validateImageBuffer(Buffer.from("not-an-image"), 1024),
      (err: unknown) =>
        err instanceof AiIllustrationError &&
        (err as AiIllustrationError).code === "INVALID_IMAGE",
    );
  });
});
