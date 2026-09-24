import type { BuilderStepId } from "@/types/builder";
import type { SignDesignState } from "@/types/signDesign";

export function canProceed(step: BuilderStepId, design: SignDesignState): boolean {
  switch (step) {
    case "start":
      return design.creationMode !== null;
    case "upload":
      return design.originalImage !== null;
    case "illustrationStyle":
      return canLeaveIllustrationStyleStep(design);
    case "design":
      return isDesignWorkspaceComplete(design);
    case "review":
      return isDesignComplete(design);
    default:
      return false;
  }
}

export function canLeaveIllustrationStyleStep(design: SignDesignState): boolean {
  if (!design.photoIllustrationStyleId) return false;
  if (design.illustration?.source === "ai") return true;
  if (design.illustration?.source === "mockAi") return true;
  return false;
}

export function isDesignWorkspaceComplete(design: SignDesignState): boolean {
  if (!design.backgroundId) return false;
  if (design.text.value.trim().length < 1) return false;
  if (!design.material) return false;
  return true;
}

export function isDesignComplete(design: SignDesignState): boolean {
  if (!design.creationMode || !design.originalImage || !design.illustration) {
    return false;
  }
  if (design.creationMode === "photo") {
    if (!design.photoIllustrationStyleId) return false;
    if (design.illustration.source !== "ai" && design.illustration.source !== "mockAi") {
      return false;
    }
  }
  return isDesignWorkspaceComplete(design);
}

export function stepValidationHint(
  step: BuilderStepId,
  design: SignDesignState,
): string | null {
  if (canProceed(step, design)) return null;
  switch (step) {
    case "start":
      return "בחרו איך תרצו להתחיל.";
    case "upload":
      return "העלו תמונה כדי להמשיך.";
    case "illustrationStyle":
      return "בחרו סגנון, צרו איור, ואז המשיכו.";
    case "design": {
      const missing: string[] = [];
      if (!design.backgroundId) missing.push("רקע");
      if (design.text.value.trim().length < 1) missing.push("טקסט");
      if (!design.material) missing.push("חומר");
      if (missing.length === 0) return null;
      return `השלימו: ${missing.join(" · ")}`;
    }
    default:
      return null;
  }
}
