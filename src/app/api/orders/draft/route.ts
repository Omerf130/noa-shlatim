import {
  draftIdempotencyKeySchema,
  parseAndValidateOrderDesign,
} from "@/lib/orders/orderDesignSchema";
import { createDraftOrder } from "@/lib/orders/createDraftOrder";
import { OrderError, userMessageForOrderCode } from "@/lib/orders/errors";
import { getOpenAiImageConfig } from "@/lib/openai/config";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const designRaw = form.get("design");
    const idempotencyKeyRaw = form.get("idempotencyKey");
    const originalEntry = form.get("originalImage");
    const artworkEntry = form.get("finalArtwork");

    if (typeof designRaw !== "string") {
      return orderErrorResponse("INVALID_DESIGN", 400);
    }

    let designJson: unknown;
    try {
      designJson = JSON.parse(designRaw) as unknown;
    } catch {
      return orderErrorResponse("INVALID_DESIGN", 400);
    }

    const design = parseAndValidateOrderDesign(designJson);

    const idempotencyParsed = draftIdempotencyKeySchema.safeParse(idempotencyKeyRaw);
    if (!idempotencyParsed.success) {
      return orderErrorResponse("INVALID_DESIGN", 400);
    }

    if (!(originalEntry instanceof File) || !(artworkEntry instanceof File)) {
      return orderErrorResponse("INVALID_ASSET", 400);
    }

    const originalBuffer = Buffer.from(await originalEntry.arrayBuffer());
    const finalArtworkBuffer = Buffer.from(await artworkEntry.arrayBuffer());
    const maxAssetBytes = getOpenAiImageConfig().maxUploadBytes;

    const result = await createDraftOrder({
      draftIdempotencyKey: idempotencyParsed.data,
      design,
      originalBuffer,
      finalArtworkBuffer,
      maxAssetBytes,
    });

    return NextResponse.json({
      ok: true,
      orderId: result.orderId,
      creationMode: design.creationMode,
      ...(result.checkoutToken ? { checkoutToken: result.checkoutToken } : {}),
      ...(result.reused ? { reused: true } : {}),
    });
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json(
        {
          ok: false,
          code: err.code,
          message: userMessageForOrderCode(err.code),
        },
        { status: err.httpStatus },
      );
    }
    console.error("[api/orders/draft]", err);
    return orderErrorResponse("ORDER_PERSIST_FAILED", 500);
  }
}

function orderErrorResponse(
  code: Parameters<typeof userMessageForOrderCode>[0],
  status: number,
) {
  return NextResponse.json(
    {
      ok: false,
      code,
      message: userMessageForOrderCode(code),
    },
    { status },
  );
}
