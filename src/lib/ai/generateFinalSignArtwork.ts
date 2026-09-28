import { toFile } from "openai";
import { AiIllustrationError } from "./errors";
import { buildFinalSignPrompt, isAllowedStyleId } from "./finalSignPrompts";
import { getOpenAiClient } from "@/lib/openai/client";
import { getOpenAiImageConfig } from "@/lib/openai/config";
import type { TextPosition } from "@/types/signDesign";

const FINAL_SIGN_SIZE = "1536x1024" as const;

export type GenerateFinalSignResult = {
  pngBuffer: Buffer;
  model: string;
  requestId?: string;
  usage?: unknown;
  durationMs: number;
};

export async function generateFinalSignArtwork(
  photoBuffer: Buffer,
  photoMime: string,
  photoFileName: string,
  styleId: string,
  backgroundBuffer: Buffer,
  backgroundMime: string,
  backgroundExt: string,
  compositionBuffer: Buffer,
  compositionMime: string,
  textPosition: TextPosition,
): Promise<GenerateFinalSignResult> {
  if (!isAllowedStyleId(styleId)) {
    throw new AiIllustrationError("INVALID_STYLE", "Invalid style", 400);
  }

  const config = getOpenAiImageConfig();
  const client = getOpenAiClient();
  if (!client) {
    throw new AiIllustrationError("AI_NOT_CONFIGURED", "No API key", 503);
  }
  if (!config.enabled) {
    throw new AiIllustrationError("AI_DISABLED", "Disabled", 503);
  }

  const prompt = buildFinalSignPrompt(styleId, textPosition);
  const started = Date.now();

  try {
    const photoFile = await toFile(photoBuffer, photoFileName || "photo", {
      type: photoMime,
    });
    const backgroundFile = await toFile(
      backgroundBuffer,
      `sign-background.${backgroundExt}`,
      { type: backgroundMime },
    );
    const compositionFile = await toFile(
      compositionBuffer,
      "composition-reference.jpg",
      { type: compositionMime },
    );

    const response = await client.images.edit({
      model: config.model,
      image: [photoFile, backgroundFile, compositionFile],
      prompt,
      size: FINAL_SIGN_SIZE,
      quality: config.quality,
      background: "opaque",
      output_format: "png",
    });

    const durationMs = Date.now() - started;
    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      throw new AiIllustrationError("GENERATION_FAILED", "Empty response", 500);
    }

    const pngBuffer = Buffer.from(b64, "base64");
    if (pngBuffer.length === 0) {
      throw new AiIllustrationError("GENERATION_FAILED", "Empty image", 500);
    }

    const requestId =
      typeof response === "object" && response !== null && "_request_id" in response
        ? String((response as { _request_id?: string })._request_id)
        : undefined;

    console.info("[ai-final-sign]", {
      model: config.model,
      styleId,
      textPosition,
      size: FINAL_SIGN_SIZE,
      durationMs,
      requestId,
      usage: (response as { usage?: unknown }).usage,
      outputBytes: pngBuffer.length,
    });

    return {
      pngBuffer,
      model: config.model,
      requestId,
      usage: (response as { usage?: unknown }).usage,
      durationMs,
    };
  } catch (err) {
    if (err instanceof AiIllustrationError) throw err;
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.toLowerCase().includes("timeout")) {
      throw new AiIllustrationError("GENERATION_TIMEOUT", message, 504);
    }
    console.error("[ai-final-sign] provider error", err);
    throw new AiIllustrationError("PROVIDER_ERROR", message, 502);
  }
}
