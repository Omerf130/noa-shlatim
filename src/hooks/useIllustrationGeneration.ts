"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import { createObjectUrl } from "@/lib/builder/objectUrl";
import { useCallback, useEffect, useState } from "react";

type IllustrationApiStatus = {
  configured: boolean;
  enabled: boolean;
  allowMockIllustration: boolean;
};

type GenerateResponse =
  | {
      ok: true;
      illustration: { mimeType: string; base64: string };
    }
  | { ok: false; code: string; message: string };

export function useIllustrationGeneration() {
  const { state, dispatch, getSourcePhotoFile } = useBuilder();
  const [apiStatus, setApiStatus] = useState<IllustrationApiStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/illustrations/status");
        if (!res.ok) throw new Error("status failed");
        const data = (await res.json()) as IllustrationApiStatus;
        if (!cancelled) setApiStatus(data);
      } catch {
        if (!cancelled) {
          setApiStatus({
            configured: false,
            enabled: false,
            allowMockIllustration: false,
          });
        }
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const generate = useCallback(async () => {
    const styleId = state.design.photoIllustrationStyleId;
    const file = getSourcePhotoFile();
    if (!styleId) return;
    if (!file) {
      dispatch({
        type: "AI_GENERATION_ERROR",
        errorCode: "MISSING_FILE",
        userMessage: "לא נמצא קובץ המקור. העלו את התמונה מחדש.",
      });
      return;
    }

    dispatch({ type: "AI_GENERATION_START" });

    try {
      const form = new FormData();
      form.append("styleId", styleId);
      form.append("image", file, file.name);

      const res = await fetch("/api/illustrations/generate", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as GenerateResponse;

      if (!data.ok) {
        dispatch({
          type: "AI_GENERATION_ERROR",
          errorCode: data.code,
          userMessage: data.message,
        });
        return;
      }

      const bytes = Uint8Array.from(atob(data.illustration.base64), (c) =>
        c.charCodeAt(0),
      );
      const blob = new Blob([bytes], { type: data.illustration.mimeType });
      const objectUrl = createObjectUrl(blob);

      dispatch({ type: "SET_AI_ILLUSTRATION", objectUrl });
    } catch {
      dispatch({
        type: "AI_GENERATION_ERROR",
        errorCode: "NETWORK",
        userMessage: "לא הצלחנו להתחבר לשרת. בדקו חיבור ונסו שוב.",
      });
    }
  }, [dispatch, getSourcePhotoFile, state.design.photoIllustrationStyleId]);

  const applyMockIllustration = useCallback(() => {
    dispatch({ type: "SET_MOCK_ILLUSTRATION" });
  }, [dispatch]);

  const canUseAi = Boolean(apiStatus?.configured && apiStatus?.enabled);
  const canUseMock = Boolean(apiStatus?.allowMockIllustration);

  return {
    apiStatus,
    statusLoading,
    generate,
    applyMockIllustration,
    canUseAi,
    canUseMock,
    aiUi: state.ui.aiIllustration,
  };
}
