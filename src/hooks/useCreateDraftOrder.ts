"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import { buildPhotoOrderDesignPayload } from "@/lib/orders/buildDesignPayload";
import { hasValidFinalSignArtwork } from "@/lib/builder/validation";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

type DraftOrderResponse =
  | { ok: true; orderId: string }
  | { ok: false; code: string; message: string };

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

    if (design.creationMode !== "photo") {
      setErrorMessage("שמירת הזמנה זמינה כרגע רק למסלול תמונה.");
      return;
    }

    if (!hasValidFinalSignArtwork(ui)) {
      setErrorMessage("יש ליצור את השלט לפני המשך להזמנה.");
      return;
    }

    const originalFile = getSourcePhotoFile();
    const finalBlob = getFinalArtworkBlob();
    const designPayload = buildPhotoOrderDesignPayload(design);

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

      const res = await fetch("/api/orders/draft", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as DraftOrderResponse;

      if (!data.ok) {
        if (data.code === "ORDER_IN_PROGRESS") {
          await new Promise((r) => setTimeout(r, 800));
          const retry = await fetch("/api/orders/draft", { method: "POST", body: form });
          const retryData = (await retry.json()) as DraftOrderResponse;
          if (retryData.ok) {
            router.push(`/checkout/${retryData.orderId}`);
            return;
          }
          setErrorMessage(retryData.message);
          return;
        }
        setErrorMessage(data.message);
        return;
      }

      router.push(`/checkout/${data.orderId}`);
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

  return {
    submitDraftOrder,
    isSubmitting,
    errorMessage,
    canSubmitPhotoOrder:
      state.design.creationMode === "photo" && hasValidFinalSignArtwork(state.ui),
  };
}
