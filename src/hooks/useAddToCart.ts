"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import {
  ADD_TO_CART_NETWORK_ERROR_MESSAGE,
  AddIdempotencyKeySession,
  parseAddToCartResponse,
  type AddToCartSuccessResponse,
} from "@/lib/cart/addToCartClient";
import {
  ADD_TO_CART_API_PATH,
  buildAddToCartFormData,
} from "@/lib/cart/buildAddToCartFormData";
import { buildOrderDesignPayload } from "@/lib/orders/buildDesignPayload";
import { hasValidFinalSignArtwork } from "@/lib/builder/validation";
import { useCartBadgeCount } from "@/components/cart/CartCountProvider";
import { useCallback, useRef, useState } from "react";

export function useAddToCart() {
  const {
    state,
    getSourcePhotoFile,
    getFinalArtworkBlob,
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

    const originalFile = getSourcePhotoFile();
    const finalBlob = getFinalArtworkBlob();
    const designPayload = buildOrderDesignPayload(design);

    if (!originalFile || !finalBlob || !designPayload) {
      setErrorMessage("חסרים נתונים להוספה לסל. חזרו לעריכה ונסו שוב.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const addIdempotencyKey = idempotencySessionRef.current.getOrCreate();

    try {
      const form = buildAddToCartFormData({
        designPayload,
        addIdempotencyKey,
        originalFile,
        finalArtworkBlob: finalBlob,
      });

      const res = await fetch(ADD_TO_CART_API_PATH, {
        method: "POST",
        body: form,
      });

      let json: unknown;
      try {
        json = await res.json();
      } catch {
        setErrorMessage(ADD_TO_CART_NETWORK_ERROR_MESSAGE);
        return;
      }

      const data = parseAddToCartResponse(json);
      if (!data) {
        setErrorMessage(ADD_TO_CART_NETWORK_ERROR_MESSAGE);
        return;
      }

      if (!data.ok) {
        setErrorMessage(data.message);
        return;
      }

      idempotencySessionRef.current.consumeAfterSuccess();
      setBadgeQuantity(data.totalQuantity);
      setAddSuccess(data);
    } catch {
      setErrorMessage(ADD_TO_CART_NETWORK_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  }, [getFinalArtworkBlob, getSourcePhotoFile, setBadgeQuantity, state]);

  const startNewSign = useCallback(() => {
    idempotencySessionRef.current.resetForNewSign();
    setErrorMessage(null);
    setAddSuccess(null);
    resetBuilderSession();
  }, [resetBuilderSession]);

  const canAddToCart =
    (state.design.creationMode === "photo" ||
      state.design.creationMode === "illustration") &&
    hasValidFinalSignArtwork(state.ui) &&
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
