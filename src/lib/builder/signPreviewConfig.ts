import type { IntegratedFinalPreviewConfig } from "@/components/builder/SignPreview/SignPreview";
import type { BuilderState } from "@/types/builder";
import type { CreationMode } from "@/types/signDesign";

function supportsIntegratedFinalArtwork(mode: CreationMode | null): mode is CreationMode {
  return mode === "photo" || mode === "illustration";
}

export function resolveSignPreviewArtworkConfig(
  state: BuilderState,
): IntegratedFinalPreviewConfig {
  const { design, ui } = state;
  const finalArt = ui.finalSignArtwork;
  const step = ui.currentStepId;

  if (!supportsIntegratedFinalArtwork(design.creationMode)) {
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
    useOriginalPhotoAsSubject:
      design.creationMode === "photo" && !showFinal && Boolean(design.originalImage),
  };
}
