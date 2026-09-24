import type { IllustrationAsset, SignDesignState } from "@/types/signDesign";
import { revokeObjectUrl } from "./objectUrl";

export function revokeIllustrationIfNeeded(
  illustration: IllustrationAsset | null,
  originalImageUrl: string | undefined,
): void {
  if (!illustration) return;
  if (illustration.objectUrl === originalImageUrl) return;
  if (illustration.source === "ai" || illustration.source === "mockAi") {
    revokeObjectUrl(illustration.objectUrl);
  }
}

export function revokeAiOrMockIllustration(design: SignDesignState): void {
  revokeIllustrationIfNeeded(design.illustration, design.originalImage?.objectUrl);
}
