import { fileTypeFromBuffer } from "file-type";
import { validateImageBuffer } from "@/lib/ai/validateUpload";
import { OrderError } from "@/lib/orders/errors";

export async function validateOriginalImageBuffer(
  buffer: Buffer,
  maxBytes: number,
): Promise<{ mime: string; ext: string }> {
  try {
    return await validateImageBuffer(buffer, maxBytes);
  } catch {
    throw new OrderError("INVALID_ASSET", "Invalid original image", 400);
  }
}

export async function validateFinalArtworkPngBuffer(
  buffer: Buffer,
  maxBytes: number,
): Promise<void> {
  if (buffer.length === 0) {
    throw new OrderError("INVALID_ASSET", "Empty artwork", 400);
  }
  if (buffer.length > maxBytes) {
    throw new OrderError("INVALID_ASSET", "Artwork too large", 413);
  }

  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || detected.mime !== "image/png") {
    throw new OrderError("INVALID_ASSET", "Artwork must be PNG", 400);
  }
}
