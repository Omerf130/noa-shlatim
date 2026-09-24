import { toFile } from "openai";
import { buildIllustrationPrompt, isAllowedStyleId } from "./illustrationPrompts";
import { AiIllustrationError } from "./errors";
import { getOpenAiClient } from "@/lib/openai/client";
import { getOpenAiImageConfig } from "@/lib/openai/config";

export type GenerateIllustrationResult = {
  pngBuffer: Buffer;
  model: string;
  requestId?: string;
  usage?: unknown;
  durationMs: number;
};

export async function generateIllustrationFromPhoto(
  imageBuffer: Buffer,
  mime: string,
  fileName: string,
  styleId: string,
): Promise<GenerateIllustrationResult> {
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

  const prompt = buildIllustrationPrompt(styleId);
  const started = Date.now();

  try {
    const file = await toFile(imageBuffer, fileName || "photo", { type: mime });
    const response = await client.images.edit({
      model: config.model,
      image: file,
      prompt,
      size: config.size as "1024x1024",
      quality: config.quality,
      background: config.background,
      output_format: config.outputFormat,
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

    console.info("[ai-illustration]", {
      model: config.model,
      styleId,
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
    console.error("[ai-illustration] provider error", err);
    throw new AiIllustrationError("PROVIDER_ERROR", message, 502);
  }
}
