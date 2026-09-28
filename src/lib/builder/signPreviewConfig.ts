import type { IntegratedFinalPreviewConfig } from "@/components/builder/SignPreview/SignPreview";
import type { BuilderState } from "@/types/builder";

export function resolveSignPreviewArtworkConfig(
  state: BuilderState,
): IntegratedFinalPreviewConfig {
  const { design, ui } = state;
  const finalArt = ui.finalSignArtwork;
  const step = ui.currentStepId;

  if (design.creationMode !== "photo") {
    return {
      showFinalArtwork: false,
      finalArtworkObjectUrl: null,
      useOriginalPhotoAsSubject: false,
    };
  }

  const hasValidFinal = finalArt.isValid && Boolean(finalArt.objectUrl);
  const showFinal =
    hasValidFinal && (step === "review" || finalArt.previewMode === "final");

  return {
    showFinalArtwork: showFinal,
    finalArtworkObjectUrl: hasValidFinal ? finalArt.objectUrl : null,
    useOriginalPhotoAsSubject: !showFinal && Boolean(design.originalImage),
  };
}
