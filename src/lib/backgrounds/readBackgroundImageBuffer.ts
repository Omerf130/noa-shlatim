import { readFile } from "node:fs/promises";
import path from "node:path";
import type { BackgroundLean } from "@/lib/backgrounds/backgroundCatalog";
import { AiIllustrationError } from "@/lib/ai/errors";
import { validateImageBuffer } from "@/lib/ai/validateUpload";
import { getPrivateBlob } from "@/lib/storage/privateBlob";

const BACKGROUNDS_URL_PREFIX = "/backgrounds/";

function resolvePublicBackgroundFilePath(imageSrc: string): string {
  if (!imageSrc.startsWith(BACKGROUNDS_URL_PREFIX)) {
    throw new AiIllustrationError("INVALID_BACKGROUND", "Invalid background asset", 400);
  }

  const relative = imageSrc.slice(BACKGROUNDS_URL_PREFIX.length);
  if (!relative.trim()) {
    throw new AiIllustrationError("INVALID_BACKGROUND", "Invalid background asset", 400);
  }

  const segments = relative.split("/").map((segment) => decodeURIComponent(segment));
  if (
    segments.some(
      (segment) => !segment || segment === "." || segment === ".." || segment.includes("\\"),
    )
  ) {
    throw new AiIllustrationError("INVALID_BACKGROUND", "Invalid background asset", 400);
  }

  const backgroundsRoot = path.join(process.cwd(), "public", "backgrounds");
  const resolved = path.join(backgroundsRoot, ...segments);
  const normalizedRoot = path.normalize(backgroundsRoot + path.sep);
  const normalizedResolved = path.normalize(resolved);

  if (!normalizedResolved.startsWith(normalizedRoot)) {
    throw new AiIllustrationError("INVALID_BACKGROUND", "Invalid background asset", 400);
  }

  return normalizedResolved;
}

async function readStreamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value) {
        chunks.push(value);
      }
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}

export type ReadBackgroundImageResult = {
  buffer: Buffer;
  mime: string;
  ext: string;
};

export async function readBackgroundImageBuffer(
  background: BackgroundLean,
  maxBytes: number,
): Promise<ReadBackgroundImageResult> {
  let buffer: Buffer;

  if (background.storageKind === "public") {
    const filePath = resolvePublicBackgroundFilePath(background.imageSrc);
    try {
      buffer = await readFile(filePath);
    } catch {
      throw new AiIllustrationError("INVALID_BACKGROUND", "Background unavailable", 400);
    }
  } else if (background.storageKind === "blob") {
    const pathname = background.blobPathname?.trim();
    if (!pathname) {
      throw new AiIllustrationError("INVALID_BACKGROUND", "Background unavailable", 400);
    }
    const blob = await getPrivateBlob(pathname);
    if (!blob) {
      throw new AiIllustrationError("INVALID_BACKGROUND", "Background unavailable", 400);
    }
    buffer = await readStreamToBuffer(blob.stream);
  } else {
    throw new AiIllustrationError("INVALID_BACKGROUND", "Invalid background asset", 400);
  }

  const { mime, ext } = await validateImageBuffer(buffer, maxBytes);
  return { buffer, mime, ext };
}
