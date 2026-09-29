"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import { getBackgroundById } from "@/data/signBackgrounds";
import { isDesignWorkspaceComplete } from "@/lib/builder/validation";
import { createObjectUrl } from "@/lib/builder/objectUrl";
import { buildCompositionReferenceBlob } from "@/lib/sign/buildCompositionReference";
import { useCallback } from "react";

type GenerateFinalResponse =
  | {
      ok: true;
      artwork: { mimeType: string; base64: string };
    }
  | { ok: false; code: string; message: string };

export function useFinalSignGeneration() {
  const { state, dispatch, getSourcePhotoFile, setFinalArtworkBlob } = useBuilder();
  const finalArt = state.ui.finalSignArtwork;

  const generateFinalSign = useCallback(async () => {
    const { design } = state;
    const styleId = design.photoIllustrationStyleId;
    const backgroundId = design.backgroundId;
    const file = getSourcePhotoFile();
    const background = backgroundId ? getBackgroundById(backgroundId) : null;
    const photoUrl = design.originalImage?.objectUrl;

    if (design.creationMode !== "photo") return;
    if (!isDesignWorkspaceComplete(design)) {
      dispatch({
        type: "FINAL_SIGN_ERROR",
        errorCode: "INCOMPLETE_DESIGN",
        userMessage: "השלימו רקע, טקסט וחומר לפני יצירת השלט.",
      });
      return;
    }
    if (!styleId) {
      dispatch({
        type: "FINAL_SIGN_ERROR",
        errorCode: "MISSING_STYLE",
        userMessage: "בחרו סגנון איור לפני יצירת השלט.",
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
    if (!file || !photoUrl) {
      dispatch({
        type: "FINAL_SIGN_ERROR",
        errorCode: "MISSING_FILE",
        userMessage: "לא נמצא קובץ המקור. העלו את התמונה מחדש.",
      });
      return;
    }

    dispatch({ type: "FINAL_SIGN_START" });

    try {
      const compositionBlob = await buildCompositionReferenceBlob({
        backgroundImageSrc: background.imageSrc,
        backgroundObjectPosition: background.objectPosition ?? "50% 50%",
        photoObjectUrl: photoUrl,
        transform: design.illustrationTransform,
      });

      const form = new FormData();
      form.append("styleId", styleId);
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

      const bytes = Uint8Array.from(atob(data.artwork.base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: data.artwork.mimeType });
      setFinalArtworkBlob(blob);
      const objectUrl = createObjectUrl(blob);
      dispatch({ type: "FINAL_SIGN_SUCCESS", objectUrl });
    } catch {
      dispatch({
        type: "FINAL_SIGN_ERROR",
        errorCode: "NETWORK",
        userMessage: "לא הצלחנו להתחבר לשרת. בדקו חיבור ונסו שוב.",
      });
    }
  }, [dispatch, getSourcePhotoFile, setFinalArtworkBlob, state]);

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
