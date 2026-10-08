"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import { createObjectUrl } from "@/lib/builder/objectUrl";
import { reportClientOperationFailure } from "@/lib/diagnostics/reportClientFailure";
import { appendSupportReference } from "@/lib/diagnostics/supportReference";
import { messageForClientOperationFailure } from "@/lib/http/clientOperationErrors";
import { readJsonResponse } from "@/lib/http/readJsonResponse";
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
      traceId?: string;
    }
  | { ok: false; code: string; message: string; traceId?: string };

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
    const backgroundId = state.design.backgroundId;
    const file = getSourcePhotoFile();
    if (!styleId) return;
    if (!backgroundId) {
      dispatch({
        type: "AI_GENERATION_ERROR",
        errorCode: "MISSING_BACKGROUND",
        userMessage: "בחרו רקע לפני יצירת האיור.",
      });
      return;
    }
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
      form.append("backgroundId", backgroundId);
      form.append("image", file, file.name);

      const res = await fetch("/api/illustrations/generate", {
        method: "POST",
        body: form,
      });
      const parsed = await readJsonResponse<GenerateResponse>(res);

      if (parsed.parseFailed || !parsed.data) {
        let traceId = parsed.traceId;
        if (!traceId) {
          traceId = await reportClientOperationFailure({
            operation: "illustration_generate",
            clientStage: "json_parse",
            httpStatus: parsed.status,
          });
        }
        dispatch({
          type: "AI_GENERATION_ERROR",
          errorCode: "HTTP_ERROR",
          userMessage: appendSupportReference(
            messageForClientOperationFailure({
              operation: "illustration_generate",
              status: parsed.status,
              parseFailed: true,
            }),
            traceId,
          ),
        });
        return;
      }

      const data = parsed.data;

      if (!data.ok) {
        dispatch({
          type: "AI_GENERATION_ERROR",
          errorCode: data.code,
          userMessage: appendSupportReference(
            messageForClientOperationFailure({
              operation: "illustration_generate",
              status: parsed.status,
              parseFailed: false,
              apiMessage: data.message,
            }),
            parsed.traceId ?? data.traceId,
          ),
        });
        return;
      }

      try {
        const bytes = Uint8Array.from(atob(data.illustration.base64), (c) =>
          c.charCodeAt(0),
        );
        const blob = new Blob([bytes], { type: data.illustration.mimeType });
        const objectUrl = createObjectUrl(blob);
        dispatch({ type: "SET_AI_ILLUSTRATION", objectUrl });
      } catch {
        const traceId =
          (await reportClientOperationFailure({
            operation: "illustration_generate",
            clientStage: "decode",
            traceId: parsed.traceId ?? data.traceId,
          })) ??
          parsed.traceId ??
          data.traceId ??
          null;
        dispatch({
          type: "AI_GENERATION_ERROR",
          errorCode: "CLIENT_DECODE",
          userMessage: appendSupportReference(
            messageForClientOperationFailure({
              operation: "illustration_generate",
              status: parsed.status,
              parseFailed: false,
              clientPhase: "decode",
            }),
            traceId,
          ),
        });
      }
    } catch {
      const traceId = await reportClientOperationFailure({
        operation: "illustration_generate",
        clientStage: "fetch",
      });
      dispatch({
        type: "AI_GENERATION_ERROR",
        errorCode: "NETWORK",
        userMessage: appendSupportReference(
          messageForClientOperationFailure({
            operation: "illustration_generate",
            status: 0,
            parseFailed: false,
          }),
          traceId,
        ),
      });
    }
  }, [
    dispatch,
    getSourcePhotoFile,
    state.design.backgroundId,
    state.design.photoIllustrationStyleId,
  ]);

  const applyMockIllustration = useCallback(() => {
    dispatch({ type: "SET_MOCK_ILLUSTRATION" });
  }, [dispatch]);

  const canUseAi = Boolean(apiStatus?.configured && apiStatus?.enabled);
  const canUseMock = Boolean(apiStatus?.allowMockIllustration);

  return {
    generate,
    applyMockIllustration,
    canUseAi,
    canUseMock,
    statusLoading,
    apiStatus,
  };
}
