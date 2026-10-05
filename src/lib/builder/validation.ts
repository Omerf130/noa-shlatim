import type { BuilderState, BuilderStepId, BuilderUiState } from "@/types/builder";
import type { SignDesignState } from "@/types/signDesign";

export function hasValidFinalSignArtwork(ui: BuilderUiState): boolean {
  const final = ui.finalSignArtwork;
  return final.isValid && final.objectUrl !== null && final.status === "success";
}

export function canProceed(step: BuilderStepId, state: BuilderState): boolean {
  const { design, ui } = state;
  switch (step) {
    case "start":
      return design.creationMode !== null;
    case "background":
      return design.backgroundId !== null;
    case "upload":
      return design.originalImage !== null;
    case "illustrationStyle":
      return canLeaveIllustrationStyleStep(design);
    case "design":
      return canLeaveDesignStep(design, ui);
    case "review":
      return isDesignComplete(design, ui);
    default:
      return false;
  }
}

export function canLeaveIllustrationStyleStep(design: SignDesignState): boolean {
  return design.photoIllustrationStyleId !== null;
}

export function isDesignWorkspaceComplete(design: SignDesignState): boolean {
  if (!design.backgroundId) return false;
  if (design.text.value.trim().length < 1) return false;
  if (!design.material) return false;
  return true;
}

export function canLeaveDesignStep(design: SignDesignState, ui: BuilderUiState): boolean {
  if (!isDesignWorkspaceComplete(design)) return false;
  if (design.creationMode === "photo" || design.creationMode === "illustration") {
    if (ui.finalSignArtwork.status === "generating") return false;
    return hasValidFinalSignArtwork(ui);
  }
  return true;
}

export function isDesignComplete(design: SignDesignState, ui: BuilderUiState): boolean {
  if (!design.creationMode || !design.originalImage) return false;

  if (design.creationMode === "photo") {
    if (!design.photoIllustrationStyleId) return false;
    return canLeaveDesignStep(design, ui);
  }

  if (!design.illustration) return false;
  return canLeaveDesignStep(design, ui);
}

export function stepValidationHint(
  step: BuilderStepId,
  state: BuilderState,
): string | null {
  const { design, ui } = state;
  if (canProceed(step, state)) return null;
  switch (step) {
    case "start":
      return "בחרו איך תרצו להתחיל.";
    case "background":
      return "בחרו רקע לשלט כדי להמשיך.";
    case "upload":
      return "העלו תמונה כדי להמשיך.";
    case "illustrationStyle":
      return "בחרו סגנון איור כדי להמשיך.";
    case "design": {
      const missing: string[] = [];
      if (!design.backgroundId) missing.push("רקע");
      if (design.text.value.trim().length < 1) missing.push("טקסט");
      if (!design.material) missing.push("חומר");
      if (missing.length > 0) {
        return `השלימו: ${missing.join(" · ")}`;
      }
      if (design.creationMode === "photo" || design.creationMode === "illustration") {
        if (ui.finalSignArtwork.status === "generating") {
          return "ממתינים לסיום יצירת השלט…";
        }
        if (!hasValidFinalSignArtwork(ui)) {
          return "צרו את השלט שלי לפני המשך לסיכום.";
        }
      }
      return null;
    }
    default:
      return null;
  }
}
