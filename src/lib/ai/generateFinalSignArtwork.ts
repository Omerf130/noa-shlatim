import { toFile } from "openai";
import { AiIllustrationError } from "./errors";
import {
  buildExistingIllustrationFinalSignPrompt,
  buildFinalSignPrompt,
  isAllowedStyleId,
} from "./finalSignPrompts";
import type { ServerStyleId } from "./illustrationPrompts";
import { getOpenAiClient } from "@/lib/openai/client";
import { getOpenAiImageConfig } from "@/lib/openai/config";
import type { CreationMode, TextPosition } from "@/types/signDesign";

const FINAL_SIGN_SIZE = "1536x1024" as const;

export type GenerateFinalSignResult = {
  pngBuffer: Buffer;
  model: string;
  requestId?: string;
  usage?: unknown;
  durationMs: number;
};

export type GenerateFinalSignArtworkParams = {
  creationMode: CreationMode;
  sourceBuffer: Buffer;
  sourceMime: string;
  sourceFileName: string;
  styleId: string | null;
  backgroundBuffer: Buffer;
  backgroundMime: string;
  backgroundExt: string;
  compositionBuffer: Buffer;
  compositionMime: string;
  textPosition: TextPosition;
};

export async function generateFinalSignArtwork(
  params: GenerateFinalSignArtworkParams,
): Promise<GenerateFinalSignResult> {
  const { creationMode, styleId } = params;

  if (creationMode === "photo") {
    if (!styleId || !isAllowedStyleId(styleId)) {
      throw new AiIllustrationError("INVALID_STYLE", "Invalid style", 400);
    }
  } else if (creationMode === "illustration") {
    if (styleId) {
      throw new AiIllustrationError(
        "INVALID_CREATION_MODE",
        "styleId not allowed for illustration mode",
        400,
      );
    }
  } else {
    throw new AiIllustrationError("INVALID_CREATION_MODE", "Invalid mode", 400);
  }

  const config = getOpenAiImageConfig();
  const client = getOpenAiClient();
  if (!client) {
    throw new AiIllustrationError("AI_NOT_CONFIGURED", "No API key", 503);
  }
  if (!config.enabled) {
    throw new AiIllustrationError("AI_DISABLED", "Disabled", 503);
  }

  const prompt =
    creationMode === "photo"
      ? buildFinalSignPrompt(styleId as ServerStyleId, params.textPosition)
      : buildExistingIllustrationFinalSignPrompt(params.textPosition);

  const started = Date.now();

  try {
    const sourceFile = await toFile(
      params.sourceBuffer,
      params.sourceFileName || "source",
      { type: params.sourceMime },
    );
    const backgroundFile = await toFile(
      params.backgroundBuffer,
      `sign-background.${params.backgroundExt}`,
      { type: params.backgroundMime },
    );
    const compositionFile = await toFile(
      params.compositionBuffer,
      "composition-reference.jpg",
      { type: params.compositionMime },
    );

    const response = await client.images.edit({
      model: config.model,
      image: [sourceFile, backgroundFile, compositionFile],
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
      creationMode,
      styleId: styleId ?? undefined,
      textPosition: params.textPosition,
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
