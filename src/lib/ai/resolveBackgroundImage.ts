import { readFile } from "node:fs/promises";
import path from "node:path";
import { getBackgroundById } from "@/data/signBackgrounds";
import { AiIllustrationError } from "@/lib/ai/errors";
import { validateImageBuffer } from "@/lib/ai/validateUpload";

const BACKGROUNDS_URL_PREFIX = "/backgrounds/";

export type ResolvedBackgroundImage = {
  buffer: Buffer;
  mime: string;
  ext: string;
  backgroundId: string;
};

function resolveBackgroundFilePath(imageSrc: string): string {
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

export async function resolveBackgroundImage(
  backgroundId: string,
  maxBytes: number,
): Promise<ResolvedBackgroundImage> {
  const id = backgroundId.trim();
  if (!id) {
    throw new AiIllustrationError("INVALID_BACKGROUND", "Missing background", 400);
  }

  const background = getBackgroundById(id);
  if (!background || !background.active) {
    throw new AiIllustrationError("INVALID_BACKGROUND", "Invalid background", 400);
  }

  const filePath = resolveBackgroundFilePath(background.imageSrc);
  let buffer: Buffer;
  try {
    buffer = await readFile(filePath);
  } catch {
    throw new AiIllustrationError("INVALID_BACKGROUND", "Background unavailable", 400);
  }

  const { mime, ext } = await validateImageBuffer(buffer, maxBytes);

  return {
    buffer,
    mime,
    ext,
    backgroundId: id,
  };
}
