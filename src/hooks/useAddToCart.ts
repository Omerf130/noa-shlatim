"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import {
  AddIdempotencyKeySession,
  messageForAddToCartHttpFailure,
  parseAddToCartResponse,
  type AddToCartSuccessResponse,
} from "@/lib/cart/addToCartClient";
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

      let json: unknown = null;
      let parseFailed = false;
      try {
        json = await res.json();
      } catch {
        parseFailed = true;
      }

      if (parseFailed) {
        setErrorMessage(messageForAddToCartHttpFailure(res.status));
        return;
      }

      const data = parseAddToCartResponse(json);
      if (!data) {
        setErrorMessage(messageForAddToCartHttpFailure(res.status));
        return;
      }

      if (!data.ok) {
        setErrorMessage(
          messageForAddToCartHttpFailure(res.status, data.message),
        );
        return;
      }

      idempotencySessionRef.current.consumeAfterSuccess();
      setBadgeQuantity(data.totalQuantity);
      setAddSuccess(data);
    } catch {
      setErrorMessage(messageForAddToCartHttpFailure(0));
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
