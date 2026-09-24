import { checkDevGenerationGuard, clientKeyFromRequest } from "@/lib/ai/devGuard";
import { AiIllustrationError, userMessageForCode } from "@/lib/ai/errors";
import { generateIllustrationFromPhoto } from "@/lib/ai/generateIllustration";
import { validateImageBuffer } from "@/lib/ai/validateUpload";
import { getOpenAiImageConfig, isAiIllustrationOperational } from "@/lib/openai/config";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

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
    const imageEntry = form.get("image");

    if (typeof styleId !== "string" || !styleId.trim()) {
      return errorResponse("INVALID_STYLE", 400);
    }
    if (!(imageEntry instanceof File)) {
      return errorResponse("INVALID_IMAGE", 400);
    }

    const arrayBuffer = await imageEntry.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { mime } = await validateImageBuffer(buffer, config.maxUploadBytes);

    const result = await generateIllustrationFromPhoto(
      buffer,
      mime,
      imageEntry.name,
      styleId.trim(),
    );

    return NextResponse.json({
      ok: true,
      illustration: {
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
    console.error("[api/illustrations/generate]", err);
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
