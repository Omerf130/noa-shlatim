import { addCartItemFromStaging } from "@/lib/cart/addCartItemFromStaging";
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
import { parseSignAssetStagingToken } from "@/lib/signAssetStaging/signAssetStagingToken";
import { getOpenAiImageConfig } from "@/lib/openai/config";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const addIdempotencyKeySchema = draftIdempotencyKeySchema;

type AddCartItemsJson = {
  design?: unknown;
  addIdempotencyKey?: unknown;
  signAssetStagingToken?: unknown;
};

export async function POST(request: Request) {
  try {
    const resolved = await resolveActiveCartForAdd(request);

    let bodyJson: AddCartItemsJson;
    try {
      bodyJson = (await request.json()) as AddCartItemsJson;
    } catch {
      return cartErrorResponse("INVALID_DESIGN", 400);
    }

    const design = parseAndValidateOrderDesign(bodyJson.design);

    const idempotencyParsed = addIdempotencyKeySchema.safeParse(
      bodyJson.addIdempotencyKey,
    );
    if (!idempotencyParsed.success) {
      return cartErrorResponse("INVALID_DESIGN", 400);
    }

    const stagingToken = parseSignAssetStagingToken(bodyJson.signAssetStagingToken);
    if (!stagingToken) {
      return cartErrorResponse("STAGING_INVALID", 400);
    }

    const maxAssetBytes = getOpenAiImageConfig().maxUploadBytes;

    const result = await addCartItemFromStaging({
      cartId: resolved.cartId,
      addIdempotencyKey: idempotencyParsed.data,
      design,
      signAssetStagingToken: stagingToken,
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
