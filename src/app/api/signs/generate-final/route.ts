import { checkDevGenerationGuard, clientKeyFromRequest } from "@/lib/ai/devGuard";
import { AiIllustrationError, userMessageForCode } from "@/lib/ai/errors";
import { generateFinalSignArtwork } from "@/lib/ai/generateFinalSignArtwork";
import { resolveBackgroundImage } from "@/lib/ai/resolveBackgroundImage";
import { validateImageBuffer } from "@/lib/ai/validateUpload";
import { getOpenAiImageConfig, isAiIllustrationOperational } from "@/lib/openai/config";
import type { TextPosition } from "@/types/signDesign";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const TEXT_POSITIONS: TextPosition[] = ["top", "center", "bottom"];

function parseTextPosition(value: FormDataEntryValue | null): TextPosition {
  if (typeof value !== "string") return "bottom";
  const trimmed = value.trim();
  if ((TEXT_POSITIONS as readonly string[]).includes(trimmed)) {
    return trimmed as TextPosition;
  }
  return "bottom";
}

export async function POST(request: Request) {
  const config = getOpenAiImageConfig();

  if (!config.apiKey) {
    return errorResponse("AI_NOT_CONFIGURED", 503);
  }
  if (!isAiIllustrationOperational()) {
    return errorResponse("AI_DISABLED", 503);
  }

  const clientKey = clientKeyFromRequest(request);
  if (!checkDevGenerationGuard(clientKey)) {
    return errorResponse("RATE_LIMITED", 429);
  }

  try {
    const form = await request.formData();
    const styleId = form.get("styleId");
    const backgroundId = form.get("backgroundId");
    const imageEntry = form.get("image");
    const compositionEntry = form.get("compositionReference");
    const textPosition = parseTextPosition(form.get("textPosition"));

    if (typeof styleId !== "string" || !styleId.trim()) {
      return errorResponse("INVALID_STYLE", 400);
    }
    if (typeof backgroundId !== "string" || !backgroundId.trim()) {
      return errorResponse("INVALID_BACKGROUND", 400);
    }
    if (!(imageEntry instanceof File)) {
      return errorResponse("INVALID_IMAGE", 400);
    }
    if (!(compositionEntry instanceof File)) {
      return errorResponse("INVALID_IMAGE", 400);
    }

    const photoBuffer = Buffer.from(await imageEntry.arrayBuffer());
    const { mime: photoMime } = await validateImageBuffer(photoBuffer, config.maxUploadBytes);

    const compositionBuffer = Buffer.from(await compositionEntry.arrayBuffer());
    const { mime: compositionMime } = await validateImageBuffer(
      compositionBuffer,
      config.maxUploadBytes,
    );

    const background = await resolveBackgroundImage(
      backgroundId.trim(),
      config.maxUploadBytes,
    );

    const result = await generateFinalSignArtwork(
      photoBuffer,
      photoMime,
      imageEntry.name,
      styleId.trim(),
      background.buffer,
      background.mime,
      background.ext,
      compositionBuffer,
      compositionMime,
      textPosition,
    );

    return NextResponse.json({
      ok: true,
      artwork: {
        mimeType: "image/png",
        base64: result.pngBuffer.toString("base64"),
      },
      meta: {
        styleId: styleId.trim(),
        model: result.model,
      },
    });
  } catch (err) {
    if (err instanceof AiIllustrationError) {
      return NextResponse.json(
        {
          ok: false,
          code: err.code,
          message: userMessageForCode(err.code),
        },
        { status: err.httpStatus },
      );
    }
    console.error("[api/signs/generate-final]", err);
    return errorResponse("GENERATION_FAILED", 500);
  }
}

function errorResponse(code: Parameters<typeof userMessageForCode>[0], status: number) {
  return NextResponse.json(
    {
      ok: false,
      code,
      message: userMessageForCode(code),
    },
    { status },
  );
}
