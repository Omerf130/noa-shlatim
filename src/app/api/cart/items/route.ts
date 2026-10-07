import { addCartItem } from "@/lib/cart/addCartItem";
import {
  CART_ACCESS_COOKIE,
  cartAccessCookieOptions,
} from "@/lib/cart/constants";
import { resolveActiveCartForAdd } from "@/lib/cart/resolveActiveCartForAdd";
import {
  draftIdempotencyKeySchema,
  parseAndValidateOrderDesign,
} from "@/lib/orders/orderDesignSchema";
import { OrderError, userMessageForOrderCode } from "@/lib/orders/errors";
import { getOpenAiImageConfig } from "@/lib/openai/config";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const addIdempotencyKeySchema = draftIdempotencyKeySchema;

export async function POST(request: Request) {
  try {
    const resolved = await resolveActiveCartForAdd(request);

    const form = await request.formData();
    const designRaw = form.get("design");
    const idempotencyKeyRaw = form.get("addIdempotencyKey");
    const originalEntry = form.get("originalImage");
    const artworkEntry = form.get("finalArtwork");

    if (typeof designRaw !== "string") {
      return cartErrorResponse("INVALID_DESIGN", 400);
    }

    let designJson: unknown;
    try {
      designJson = JSON.parse(designRaw) as unknown;
    } catch {
      return cartErrorResponse("INVALID_DESIGN", 400);
    }

    const design = parseAndValidateOrderDesign(designJson);

    const idempotencyParsed = addIdempotencyKeySchema.safeParse(idempotencyKeyRaw);
    if (!idempotencyParsed.success) {
      return cartErrorResponse("INVALID_DESIGN", 400);
    }

    if (!(originalEntry instanceof File) || !(artworkEntry instanceof File)) {
      return cartErrorResponse("INVALID_ASSET", 400);
    }

    const originalBuffer = Buffer.from(await originalEntry.arrayBuffer());
    const finalArtworkBuffer = Buffer.from(await artworkEntry.arrayBuffer());
    const maxAssetBytes = getOpenAiImageConfig().maxUploadBytes;

    const result = await addCartItem({
      cartId: resolved.cartId,
      addIdempotencyKey: idempotencyParsed.data,
      design,
      originalBuffer,
      finalArtworkBuffer,
      maxAssetBytes,
    });

    const response = NextResponse.json(result);
    if (resolved.setCookie) {
      response.cookies.set(
        CART_ACCESS_COOKIE,
        resolved.setCookie.value,
        cartAccessCookieOptions(resolved.setCookie.maxAge),
      );
    }
    return response;
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
    console.error("[api/cart/items]", err);
    return cartErrorResponse("ORDER_PERSIST_FAILED", 500);
  }
}

function cartErrorResponse(
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
