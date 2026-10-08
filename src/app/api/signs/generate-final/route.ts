import { checkDevGenerationGuard, clientKeyFromRequest } from "@/lib/ai/devGuard";
import { AiIllustrationError, userMessageForCode } from "@/lib/ai/errors";
import { generateFinalSignArtwork } from "@/lib/ai/generateFinalSignArtwork";
import { isAllowedStyleId } from "@/lib/ai/finalSignPrompts";
import { resolveBackgroundImage } from "@/lib/ai/resolveBackgroundImage";
import { validateImageBuffer } from "@/lib/ai/validateUpload";
import { beginOperationTrace } from "@/lib/diagnostics/operationTrace";
import { getOpenAiImageConfig, isAiIllustrationOperational } from "@/lib/openai/config";
import { createSignAssetStaging } from "@/lib/signAssetStaging/createSignAssetStaging";
import type { CreationMode, TextPosition } from "@/types/signDesign";

/** Inbound multipart (source + composition) remains subject to platform body limits — see stagingConfig. */

export const runtime = "nodejs";

const TEXT_POSITIONS: TextPosition[] = ["top", "center", "bottom"];

const CREATION_MODES: CreationMode[] = ["photo", "illustration"];

function parseTextPosition(value: FormDataEntryValue | null): TextPosition {
  if (typeof value !== "string") return "bottom";
  const trimmed = value.trim();
  if ((TEXT_POSITIONS as readonly string[]).includes(trimmed)) {
    return trimmed as TextPosition;
  }
  return "bottom";
}

function parseCreationMode(value: FormDataEntryValue | null): CreationMode | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if ((CREATION_MODES as readonly string[]).includes(trimmed)) {
    return trimmed as CreationMode;
  }
  return null;
}

export async function POST(request: Request) {
  const trace = beginOperationTrace("generate_final");
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

    const creationMode = parseCreationMode(form.get("creationMode"));
    const styleIdRaw = form.get("styleId");
    const backgroundId = form.get("backgroundId");
    const imageEntry = form.get("image");
    const compositionEntry = form.get("compositionReference");
    const textPosition = parseTextPosition(form.get("textPosition"));

    if (!creationMode) {
      return trace.failJson({
        stage: "validate",
        code: "INVALID_CREATION_MODE",
        status: 400,
        message: userMessageForCode("INVALID_CREATION_MODE"),
      });
    }

    const styleId =
      typeof styleIdRaw === "string" && styleIdRaw.trim()
        ? styleIdRaw.trim()
        : null;

    if (creationMode === "photo") {
      if (!styleId || !isAllowedStyleId(styleId)) {
        return trace.failJson({
          stage: "validate",
          code: "INVALID_STYLE",
          status: 400,
          message: userMessageForCode("INVALID_STYLE"),
        });
      }
    } else if (styleId) {
      return trace.failJson({
        stage: "validate",
        code: "INVALID_CREATION_MODE",
        status: 400,
        message: userMessageForCode("INVALID_CREATION_MODE"),
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
    if (!(compositionEntry instanceof File)) {
      return trace.failJson({
        stage: "validate",
        code: "INVALID_IMAGE",
        status: 400,
        message: userMessageForCode("INVALID_IMAGE"),
      });
    }

    const sourceBuffer = Buffer.from(await imageEntry.arrayBuffer());
    const { mime: sourceMime } = await validateImageBuffer(
      sourceBuffer,
      config.maxUploadBytes,
    );

    const compositionBuffer = Buffer.from(await compositionEntry.arrayBuffer());
    const { mime: compositionMime } = await validateImageBuffer(
      compositionBuffer,
      config.maxUploadBytes,
    );

    const background = await resolveBackgroundImage(
      backgroundId.trim(),
      config.maxUploadBytes,
    );

    const result = await generateFinalSignArtwork({
      creationMode,
      sourceBuffer,
      sourceMime,
      sourceFileName: imageEntry.name,
      styleId,
      backgroundBuffer: background.buffer,
      backgroundMime: background.mime,
      backgroundExt: background.ext,
      compositionBuffer,
      compositionMime,
      textPosition,
    });

    const staged = await createSignAssetStaging({
      originalBuffer: sourceBuffer,
      finalArtworkBuffer: result.pngBuffer,
      maxAssetBytes: config.maxUploadBytes,
    });

    return trace.okJson({
      ok: true,
      artwork: {
        mimeType: "image/png",
        base64: result.pngBuffer.toString("base64"),
      },
      signAssetStagingToken: staged.signAssetStagingToken,
      meta: {
        creationMode,
        styleId: styleId ?? undefined,
        model: result.model,
      },
    });
  } catch (err) {
    if (err instanceof AiIllustrationError) {
      const stage =
        err.code === "GENERATION_TIMEOUT" || err.code === "PROVIDER_ERROR"
          ? "provider"
          : err.code === "IMAGE_TOO_LARGE"
            ? "validate"
            : "unknown";
      return trace.failJson({
        stage,
        code: err.code,
        status: err.httpStatus,
        message: userMessageForCode(err.code),
      });
    }
    console.error("[api/signs/generate-final]", trace.traceId, err);
    return trace.failJson({
      stage: "unknown",
      code: "GENERATION_FAILED",
      status: 500,
      message: userMessageForCode("GENERATION_FAILED"),
    });
  }
}
