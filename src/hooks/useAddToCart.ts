"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import {
  AddIdempotencyKeySession,
  messageForAddToCartHttpFailure,
  parseAddToCartResponse,
  type AddToCartSuccessResponse,
} from "@/lib/cart/addToCartClient";
import { reportClientOperationFailure } from "@/lib/diagnostics/reportClientFailure";
import { appendSupportReference } from "@/lib/diagnostics/supportReference";
import { readJsonResponse } from "@/lib/http/readJsonResponse";
import {
  ADD_TO_CART_API_PATH,
  buildAddToCartJsonBody,
} from "@/lib/cart/buildAddToCartJsonBody";
import { buildOrderDesignPayload } from "@/lib/orders/buildDesignPayload";
import { hasValidFinalSignArtwork } from "@/lib/builder/validation";
import { useCartBadgeCount } from "@/components/cart/CartCountProvider";
import { useCallback, useRef, useState } from "react";

export function useAddToCart() {
  const {
    state,
    getSignAssetStagingToken,
    resetBuilderSession,
  } = useBuilder();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<AddToCartSuccessResponse | null>(
    null,
  );
  const idempotencySessionRef = useRef(new AddIdempotencyKeySession());
  const { setBadgeQuantity } = useCartBadgeCount();

  const submitAddToCart = useCallback(async () => {
    const { design, ui } = state;
    const creationMode = design.creationMode;

    if (creationMode !== "photo" && creationMode !== "illustration") {
      setErrorMessage("לא ניתן להוסיף לסל — בחרו מסלול יצירה.");
      return;
    }

    if (!hasValidFinalSignArtwork(ui)) {
      setErrorMessage("יש ליצור את השלט לפני הוספה לסל.");
      return;
    }

    const stagingToken = getSignAssetStagingToken();
    const designPayload = buildOrderDesignPayload(design);

    if (!stagingToken || !designPayload) {
      setErrorMessage(
        "חסרים נתונים להוספה לסל. צרו את השלט מחדש ונסו שוב.",
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const addIdempotencyKey = idempotencySessionRef.current.getOrCreate();

    try {
      const res = await fetch(ADD_TO_CART_API_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: buildAddToCartJsonBody({
          design: designPayload,
          addIdempotencyKey,
          signAssetStagingToken: stagingToken,
        }),
      });

      const parsed = await readJsonResponse<Record<string, unknown>>(res);

      if (parsed.parseFailed || !parsed.data) {
        let traceId = parsed.traceId;
        if (!traceId) {
          traceId = await reportClientOperationFailure({
            operation: "cart_add_item",
            clientStage: "json_parse",
            httpStatus: parsed.status,
          });
        }
        setErrorMessage(
          appendSupportReference(
            messageForAddToCartHttpFailure(parsed.status),
            traceId,
          ),
        );
        return;
      }

      const data = parseAddToCartResponse(parsed.data);
      if (!data) {
        const traceFromBody =
          typeof parsed.data.traceId === "string" ? parsed.data.traceId : null;
        setErrorMessage(
          appendSupportReference(
            messageForAddToCartHttpFailure(parsed.status),
            parsed.traceId ?? traceFromBody,
          ),
        );
        return;
      }

      if (!data.ok) {
        const traceFromBody =
          typeof parsed.data.traceId === "string" ? parsed.data.traceId : null;
        setErrorMessage(
          appendSupportReference(
            messageForAddToCartHttpFailure(parsed.status, data.message),
            parsed.traceId ?? traceFromBody,
          ),
        );
        return;
      }

      idempotencySessionRef.current.consumeAfterSuccess();
      setBadgeQuantity(data.totalQuantity);
      setAddSuccess(data);
    } catch {
      const traceId = await reportClientOperationFailure({
        operation: "cart_add_item",
        clientStage: "fetch",
      });
      setErrorMessage(
        appendSupportReference(messageForAddToCartHttpFailure(0), traceId),
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [getSignAssetStagingToken, setBadgeQuantity, state]);

  const startNewSign = useCallback(() => {
    idempotencySessionRef.current.resetForNewSign();
    setErrorMessage(null);
    setAddSuccess(null);
    resetBuilderSession();
  }, [resetBuilderSession]);

  const hasStagingToken = Boolean(getSignAssetStagingToken());

  const canAddToCart =
    (state.design.creationMode === "photo" ||
      state.design.creationMode === "illustration") &&
    hasValidFinalSignArtwork(state.ui) &&
    hasStagingToken &&
    addSuccess === null;

  return {
    submitAddToCart,
    startNewSign,
    isSubmitting,
    errorMessage,
    addSuccess,
    canAddToCart,
    /** @internal tests */
    peekAddIdempotencyKey: () => idempotencySessionRef.current.peek(),
  };
}
