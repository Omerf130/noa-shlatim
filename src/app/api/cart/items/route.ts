import { addCartItemFromStaging } from "@/lib/cart/addCartItemFromStaging";
import {
  CART_ACCESS_COOKIE,
  cartAccessCookieOptions,
} from "@/lib/cart/constants";
import { resolveActiveCartForAdd } from "@/lib/cart/resolveActiveCartForAdd";
import { beginOperationTrace } from "@/lib/diagnostics/operationTrace";
import {
  draftIdempotencyKeySchema,
  parseAndValidateOrderDesign,
} from "@/lib/orders/orderDesignSchema";
import { OrderError, userMessageForOrderCode } from "@/lib/orders/errors";
import { parseSignAssetStagingToken } from "@/lib/signAssetStaging/signAssetStagingToken";
import { getOpenAiImageConfig } from "@/lib/openai/config";

export const runtime = "nodejs";

const addIdempotencyKeySchema = draftIdempotencyKeySchema;

type AddCartItemsJson = {
  design?: unknown;
  addIdempotencyKey?: unknown;
  signAssetStagingToken?: unknown;
};

export async function POST(request: Request) {
  const trace = beginOperationTrace("cart_add_item");

  try {
    const resolved = await resolveActiveCartForAdd(request);

    let bodyJson: AddCartItemsJson;
    try {
      bodyJson = (await request.json()) as AddCartItemsJson;
    } catch {
      return trace.failJson({
        stage: "parse_body",
        code: "INVALID_DESIGN",
        status: 400,
        message: userMessageForOrderCode("INVALID_DESIGN"),
      });
    }

    const design = parseAndValidateOrderDesign(bodyJson.design);

    const idempotencyParsed = addIdempotencyKeySchema.safeParse(
      bodyJson.addIdempotencyKey,
    );
    if (!idempotencyParsed.success) {
      return trace.failJson({
        stage: "validate",
        code: "INVALID_DESIGN",
        status: 400,
        message: userMessageForOrderCode("INVALID_DESIGN"),
      });
    }

    const stagingToken = parseSignAssetStagingToken(bodyJson.signAssetStagingToken);
    if (!stagingToken) {
      return trace.failJson({
        stage: "validate",
        code: "STAGING_INVALID",
        status: 400,
        message: userMessageForOrderCode("STAGING_INVALID"),
      });
    }

    const maxAssetBytes = getOpenAiImageConfig().maxUploadBytes;

    const result = await addCartItemFromStaging({
      cartId: resolved.cartId,
      addIdempotencyKey: idempotencyParsed.data,
      design,
      signAssetStagingToken: stagingToken,
      maxAssetBytes,
    });

    const response = trace.okJson(result);
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
      const stage =
        err.code === "STORAGE_FAILED"
          ? "storage"
          : err.code === "ORDER_PERSIST_FAILED"
            ? "persist"
            : "validate";
      return trace.failJson({
        stage,
        code: err.code,
        status: err.httpStatus,
        message: userMessageForOrderCode(err.code),
      });
    }
    console.error("[api/cart/items]", trace.traceId, err);
    return trace.failJson({
      stage: "unknown",
      code: "ORDER_PERSIST_FAILED",
      status: 500,
      message: userMessageForOrderCode("ORDER_PERSIST_FAILED"),
    });
  }
}
