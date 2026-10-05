"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import { buildOrderDesignPayload } from "@/lib/orders/buildDesignPayload";
import { hasValidFinalSignArtwork } from "@/lib/builder/validation";
import type { CreationMode } from "@/types/signDesign";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

type DraftOrderResponse =
  | {
      ok: true;
      orderId: string;
      creationMode?: CreationMode;
      checkoutToken?: string;
      reused?: boolean;
    }
  | { ok: false; code: string; message: string };

function checkoutRedirectPath(orderId: string, checkoutToken?: string): string {
  if (checkoutToken) {
    return `/checkout/${orderId}?access=${encodeURIComponent(checkoutToken)}`;
  }
  return `/checkout/${orderId}`;
}

export function useCreateDraftOrder() {
  const router = useRouter();
  const { state, getSourcePhotoFile, getFinalArtworkBlob } = useBuilder();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  const ensureIdempotencyKey = useCallback(() => {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }
    return idempotencyKeyRef.current;
  }, []);

  const submitDraftOrder = useCallback(async () => {
    const { design, ui } = state;
    const creationMode = design.creationMode;

    if (creationMode !== "photo" && creationMode !== "illustration") {
      setErrorMessage("לא ניתן לשמור הזמנה — בחרו מסלול יצירה.");
      return;
    }

    if (!hasValidFinalSignArtwork(ui)) {
      setErrorMessage("יש ליצור את השלט לפני המשך להזמנה.");
      return;
    }

    const originalFile = getSourcePhotoFile();
    const finalBlob = getFinalArtworkBlob();
    const designPayload = buildOrderDesignPayload(design);

    if (!originalFile || !finalBlob || !designPayload) {
      setErrorMessage("חסרים נתונים לשמירת ההזמנה. חזרו לעריכה ונסו שוב.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const idempotencyKey = ensureIdempotencyKey();

    try {
      const form = new FormData();
      form.append("design", JSON.stringify(designPayload));
      form.append("idempotencyKey", idempotencyKey);
      form.append("originalImage", originalFile, originalFile.name || "original");
      form.append("finalArtwork", finalBlob, "artwork.png");

      const postDraft = () =>
        fetch("/api/orders/draft", {
          method: "POST",
          body: form,
        });

      let res = await postDraft();
      let data = (await res.json()) as DraftOrderResponse;

      if (!data.ok) {
        if (data.code === "ORDER_IN_PROGRESS") {
          await new Promise((r) => setTimeout(r, 800));
          res = await postDraft();
          data = (await res.json()) as DraftOrderResponse;
        }
        if (!data.ok) {
          setErrorMessage(data.message);
          return;
        }
      }

      const success = data as Extract<DraftOrderResponse, { ok: true }>;
      router.push(checkoutRedirectPath(success.orderId, success.checkoutToken));
    } catch {
      setErrorMessage("לא הצלחנו לשמור את ההזמנה. בדקו חיבור ונסו שוב.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    ensureIdempotencyKey,
    getFinalArtworkBlob,
    getSourcePhotoFile,
    router,
    state,
  ]);

  const canSubmitDraftOrder =
    (state.design.creationMode === "photo" ||
      state.design.creationMode === "illustration") &&
    hasValidFinalSignArtwork(state.ui);

  return {
    submitDraftOrder,
    isSubmitting,
    errorMessage,
    canSubmitDraftOrder,
    /** @deprecated Use canSubmitDraftOrder */
    canSubmitPhotoOrder:
      state.design.creationMode === "photo" && hasValidFinalSignArtwork(state.ui),
  };
}
