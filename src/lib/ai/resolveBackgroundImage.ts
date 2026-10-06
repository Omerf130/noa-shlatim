import { readBackgroundImageBuffer } from "@/lib/backgrounds/readBackgroundImageBuffer";
import { loadBackgroundForRender } from "@/lib/backgrounds/loadBackgrounds";
import { AiIllustrationError } from "@/lib/ai/errors";

export type ResolvedBackgroundImage = {
  buffer: Buffer;
  mime: string;
  ext: string;
  backgroundId: string;
};

export async function resolveBackgroundImage(
  backgroundId: string,
  maxBytes: number,
  options?: { requireEnabled?: boolean },
): Promise<ResolvedBackgroundImage> {
  const id = backgroundId.trim();
  if (!id) {
    throw new AiIllustrationError("INVALID_BACKGROUND", "Missing background", 400);
  }

  const requireEnabled = options?.requireEnabled ?? true;
  const background = await loadBackgroundForRender(id);
  if (!background) {
    throw new AiIllustrationError("INVALID_BACKGROUND", "Invalid background", 400);
  }
  if (requireEnabled && !background.enabled) {
    throw new AiIllustrationError("INVALID_BACKGROUND", "Invalid background", 400);
  }

  const { buffer, mime, ext } = await readBackgroundImageBuffer(background, maxBytes);

  return {
    buffer,
    mime,
    ext,
    backgroundId: id,
  };
}
