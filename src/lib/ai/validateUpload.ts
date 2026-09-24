import { fileTypeFromBuffer } from "file-type";
import { AiIllustrationError } from "./errors";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function validateImageBuffer(
  buffer: Buffer,
  maxBytes: number,
): Promise<{ mime: string; ext: string }> {
  if (buffer.length === 0) {
    throw new AiIllustrationError("INVALID_IMAGE", "Empty file", 400);
  }
  if (buffer.length > maxBytes) {
    throw new AiIllustrationError("IMAGE_TOO_LARGE", "Too large", 413);
  }

  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED_MIME.has(detected.mime)) {
    throw new AiIllustrationError("INVALID_IMAGE", "Bad type", 400);
  }

  return { mime: detected.mime, ext: detected.ext };
}
