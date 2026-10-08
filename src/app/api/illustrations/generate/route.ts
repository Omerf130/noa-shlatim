import { checkDevGenerationGuard, clientKeyFromRequest } from "@/lib/ai/devGuard";
import { AiIllustrationError, userMessageForCode } from "@/lib/ai/errors";
import { generateIllustrationFromPhoto } from "@/lib/ai/generateIllustration";
import { resolveBackgroundImage } from "@/lib/ai/resolveBackgroundImage";
import { validateImageBuffer } from "@/lib/ai/validateUpload";
import { beginOperationTrace } from "@/lib/diagnostics/operationTrace";
import { getOpenAiImageConfig, isAiIllustrationOperational } from "@/lib/openai/config";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const trace = beginOperationTrace("illustration_generate");
  const config = getOpenAiImageConfig();

  if (!config.apiKey) {
    return trace.failJson({
      stage: "auth",
      code: "AI_NOT_CONFIGURED",
      status: 503,
      message: userMessageForCode("AI_NOT_CONFIGURED"),
    });
  }
  if (!isAiIllustrationOperational()) {
    return trace.failJson({
      stage: "auth",
      code: "AI_DISABLED",
      status: 503,
      message: userMessageForCode("AI_DISABLED"),
    });
  }

  const clientKey = clientKeyFromRequest(request);
  if (!checkDevGenerationGuard(clientKey)) {
    return trace.failJson({
      stage: "auth",
      code: "RATE_LIMITED",
      status: 429,
      message: userMessageForCode("RATE_LIMITED"),
    });
  }

  try {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return trace.failJson({
        stage: "parse_body",
        code: "INVALID_IMAGE",
        status: 400,
        message: userMessageForCode("INVALID_IMAGE"),
      });
    }

    const styleId = form.get("styleId");
    const backgroundId = form.get("backgroundId");
    const imageEntry = form.get("image");

    if (typeof styleId !== "string" || !styleId.trim()) {
      return trace.failJson({
        stage: "validate",
        code: "INVALID_STYLE",
        status: 400,
        message: userMessageForCode("INVALID_STYLE"),
      });
    }
    if (typeof backgroundId !== "string" || !backgroundId.trim()) {
      return trace.failJson({
        stage: "validate",
        code: "INVALID_BACKGROUND",
        status: 400,
        message: userMessageForCode("INVALID_BACKGROUND"),
      });
    }
    if (!(imageEntry instanceof File)) {
      return trace.failJson({
        stage: "validate",
        code: "INVALID_IMAGE",
        status: 400,
        message: userMessageForCode("INVALID_IMAGE"),
      });
    }

    const arrayBuffer = await imageEntry.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { mime } = await validateImageBuffer(buffer, config.maxUploadBytes);

    const background = await resolveBackgroundImage(
      backgroundId.trim(),
      config.maxUploadBytes,
    );

    const result = await generateIllustrationFromPhoto(
      buffer,
      mime,
      imageEntry.name,
      styleId.trim(),
      background.buffer,
      background.mime,
      background.ext,
    );

    return trace.okJson({
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
      const stage =
        err.code === "GENERATION_TIMEOUT" || err.code === "PROVIDER_ERROR"
          ? "provider"
          : "unknown";
      return trace.failJson({
        stage,
        code: err.code,
        status: err.httpStatus,
        message: userMessageForCode(err.code),
      });
    }
    console.error("[api/illustrations/generate]", trace.traceId, err);
    return trace.failJson({
      stage: "unknown",
      code: "GENERATION_FAILED",
      status: 500,
      message: userMessageForCode("GENERATION_FAILED"),
    });
  }
}
