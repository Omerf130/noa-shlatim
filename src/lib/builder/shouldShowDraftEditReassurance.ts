import { resolveSignPreviewArtworkConfig } from "@/lib/builder/signPreviewConfig";
import type { BuilderState } from "@/types/builder";

export function shouldShowDraftEditReassurance(state: BuilderState): boolean {
  const { design, ui } = state;
  if (design.creationMode !== "photo") return false;
  if (ui.currentStepId !== "design") return false;
  if (ui.finalSignArtwork.status === "generating") return false;
  const preview = resolveSignPreviewArtworkConfig(state);
  return !preview.showFinalArtwork;
}
