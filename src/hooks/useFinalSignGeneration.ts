"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import { findCustomerBackground } from "@/lib/builder/backgroundSelection";
import { isDesignWorkspaceComplete } from "@/lib/builder/validation";
import { createObjectUrl } from "@/lib/builder/objectUrl";
import { buildCompositionReferenceBlob } from "@/lib/sign/buildCompositionReference";
import { useCallback } from "react";

type GenerateFinalResponse =
  | {
      ok: true;
      artwork: { mimeType: string; base64: string };
      signAssetStagingToken: string;
    }
  | { ok: false; code: string; message: string };

async function releaseStagingToken(token: string | null): Promise<void> {
  if (!token) {
    return;
  }
  try {
    await fetch("/api/signs/release-staging", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signAssetStagingToken: token }),
    });
  } catch {
    /* best-effort */
  }
}

export function useFinalSignGeneration() {
  const {
    state,
    dispatch,
    getSourcePhotoFile,
    setFinalArtworkBlob,
    getSignAssetStagingToken,
    setSignAssetStagingToken,
    customerBackgrounds,
  } = useBuilder();
  const finalArt = state.ui.finalSignArtwork;

  const generateFinalSign = useCallback(async () => {
    if (state.ui.finalSignArtwork.status === "generating") {
      return;
    }

    const { design } = state;
    const creationMode = design.creationMode;
    const styleId = design.photoIllustrationStyleId;
    const backgroundId = design.backgroundId;
    const file = getSourcePhotoFile();
    const background = backgroundId
      ? findCustomerBackground(customerBackgrounds, backgroundId)
      : undefined;
    const subjectUrl = design.originalImage?.objectUrl;

    if (creationMode !== "photo" && creationMode !== "illustration") {
      return;
    }

    if (!isDesignWorkspaceComplete(design)) {
      dispatch({
        type: "FINAL_SIGN_ERROR",
        errorCode: "INCOMPLETE_DESIGN",
        userMessage: "השלימו רקע, טקסט וחומר לפני יצירת השלט.",
      });
      return;
    }

    if (creationMode === "photo") {
      if (!styleId) {
        dispatch({
          type: "FINAL_SIGN_ERROR",
          errorCode: "MISSING_STYLE",
          userMessage: "בחרו סגנון איור לפני יצירת השלט.",
        });
        return;
      }
    } else if (!design.illustration) {
      dispatch({
        type: "FINAL_SIGN_ERROR",
        errorCode: "MISSING_FILE",
        userMessage: "לא נמצא קובץ האיור. העלו את האיור מחדש.",
      });
      return;
    }

    if (!backgroundId || !background) {
      dispatch({
        type: "FINAL_SIGN_ERROR",
        errorCode: "MISSING_BACKGROUND",
        userMessage: "בחרו רקע לפני יצירת השלט.",
      });
      return;
    }
    if (!file || !subjectUrl) {
      dispatch({
        type: "FINAL_SIGN_ERROR",
        errorCode: "MISSING_FILE",
        userMessage:
          creationMode === "photo"
            ? "לא נמצא קובץ המקור. העלו את התמונה מחדש."
            : "לא נמצא קובץ האיור. העלו את האיור מחדש.",
      });
      return;
    }

    const previousStagingToken = getSignAssetStagingToken();
    void releaseStagingToken(previousStagingToken);
    setSignAssetStagingToken(null);

    dispatch({ type: "FINAL_SIGN_START" });

    try {
      const compositionBlob = await buildCompositionReferenceBlob({
        backgroundImageSrc: background.imageSrc,
        backgroundObjectPosition: background.objectPosition ?? "50% 50%",
        subjectObjectUrl: subjectUrl,
        transform: design.illustrationTransform,
      });

      const form = new FormData();
      form.append("creationMode", creationMode);
      if (creationMode === "photo" && styleId) {
        form.append("styleId", styleId);
      }
      form.append("backgroundId", backgroundId);
      form.append("textPosition", design.text.position);
      form.append("image", file, file.name);
      form.append("compositionReference", compositionBlob, "composition-reference.jpg");

      const res = await fetch("/api/signs/generate-final", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as GenerateFinalResponse;

      if (!data.ok) {
        dispatch({
          type: "FINAL_SIGN_ERROR",
          errorCode: data.code,
          userMessage: data.message,
        });
        return;
      }

      if (!data.signAssetStagingToken?.trim()) {
        dispatch({
          type: "FINAL_SIGN_ERROR",
          errorCode: "STAGING_MISSING",
          userMessage: "לא הצלחנו לשמור את השלט. נסו שוב.",
        });
        return;
      }

      const bytes = Uint8Array.from(atob(data.artwork.base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: data.artwork.mimeType });
      setFinalArtworkBlob(blob);
      setSignAssetStagingToken(data.signAssetStagingToken.trim());
      const objectUrl = createObjectUrl(blob);
      dispatch({ type: "FINAL_SIGN_SUCCESS", objectUrl });
    } catch {
      dispatch({
        type: "FINAL_SIGN_ERROR",
        errorCode: "NETWORK",
        userMessage: "לא הצלחנו להתחבר לשרת. בדקו חיבור ונסו שוב.",
      });
    }
  }, [
    customerBackgrounds,
    dispatch,
    getSignAssetStagingToken,
    getSourcePhotoFile,
    setFinalArtworkBlob,
    setSignAssetStagingToken,
    state,
  ]);

  const showDraftPreview = useCallback(() => {
    dispatch({ type: "FINAL_SIGN_SHOW_DRAFT" });
  }, [dispatch]);

  const showFinalPreview = useCallback(() => {
    dispatch({ type: "FINAL_SIGN_SHOW_FINAL" });
  }, [dispatch]);

  return {
    finalArt,
    generateFinalSign,
    showDraftPreview,
    showFinalPreview,
    isGenerating: finalArt.status === "generating",
    hasValidFinal: finalArt.isValid && Boolean(finalArt.objectUrl),
  };
}
