import type { CreationMode } from "@/types/signDesign";
import type { BuilderStepId } from "@/types/builder";

export type StepMeta = {
  id: BuilderStepId;
  progressLabel: string;
};

const stepMetaMap: Record<BuilderStepId, StepMeta> = {
  start: { id: "start", progressLabel: "התחלה" },
  upload: { id: "upload", progressLabel: "תמונה" },
  illustrationStyle: { id: "illustrationStyle", progressLabel: "סגנון" },
  design: { id: "design", progressLabel: "עיצוב" },
  review: { id: "review", progressLabel: "סיכום" },
};

export function getStepMeta(id: BuilderStepId): StepMeta {
  return stepMetaMap[id];
}

export function getStepsForMode(mode: CreationMode | null): BuilderStepId[] {
  if (!mode) return ["start"];
  if (mode === "photo") {
    return ["start", "upload", "illustrationStyle", "design", "review"];
  }
  return ["start", "upload", "design", "review"];
}

export function getNextStep(
  mode: CreationMode | null,
  current: BuilderStepId,
): BuilderStepId | null {
  const steps = getStepsForMode(mode);
  const idx = steps.indexOf(current);
  if (idx === -1 || idx >= steps.length - 1) return null;
  return steps[idx + 1];
}

export function getPrevStep(
  mode: CreationMode | null,
  current: BuilderStepId,
): BuilderStepId | null {
  const steps = getStepsForMode(mode);
  const idx = steps.indexOf(current);
  if (idx <= 0) return null;
  return steps[idx - 1];
}
