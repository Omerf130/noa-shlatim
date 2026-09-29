"use client";

import { SignPreview } from "@/components/builder/SignPreview/SignPreview";
import { SignGenerationOverlay } from "@/components/builder/SignPreview/SignGenerationOverlay";
import { useBuilder } from "@/components/builder/BuilderContext";
import { resolveSignPreviewArtworkConfig } from "@/lib/builder/signPreviewConfig";
import type { SignPreviewSize } from "@/components/builder/SignPreview/SignPreview";
import type {
  DecorationInstance,
  IllustrationTransform,
  TextDesign,
} from "@/types/signDesign";
import type { DesignSelectedElement, DesignWorkspaceTab } from "@/types/builder";
import styles from "./SignCompositionEditor.module.scss";

type SignCompositionEditorProps = {
  size: SignPreviewSize;
  ariaLabel?: string;
  showMockDisclaimer?: boolean;
  className?: string;
};

export function SignCompositionEditor({
  size,
  ariaLabel,
  showMockDisclaimer,
  className,
}: SignCompositionEditorProps) {
  const { state, dispatch } = useBuilder();
  const { design, ui } = state;
  const { activeTab, selectedElement } = ui.designWorkspace;
  const integratedFinalPreview = resolveSignPreviewArtworkConfig(state);
  const isGenerating = ui.finalSignArtwork.status === "generating";
  const onDesignStep = ui.currentStepId === "design";

  const compositionEditor =
    onDesignStep && !isGenerating
      ? {
          activeTab,
          selectedElement,
          onSelectElement: (element: DesignSelectedElement | null) =>
            dispatch({ type: "SET_DESIGN_SELECTED_ELEMENT", element }),
          onFocusTool: (tab: DesignWorkspaceTab) =>
            dispatch({ type: "SET_DESIGN_WORKSPACE_TAB", tab }),
          onIllustrationTransformPatch: (patch: Partial<IllustrationTransform>) =>
            dispatch({ type: "SET_ILLUSTRATION_TRANSFORM", patch }),
          onTextPatch: (patch: Partial<TextDesign>) =>
            dispatch({ type: "SET_TEXT", patch }),
          onDecorationPatch: (
            id: string,
            patch: Partial<
              Pick<DecorationInstance, "x" | "y" | "scale" | "color">
            >,
          ) => dispatch({ type: "UPDATE_DECORATION", id, patch }),
        }
      : undefined;

  if (ui.currentStepId !== "design") {
    return (
      <SignPreview
        design={design}
        size={size}
        ariaLabel={ariaLabel}
        showMockDisclaimer={showMockDisclaimer}
        className={className}
        integratedFinalPreview={integratedFinalPreview}
      />
    );
  }

  return (
    <div
      className={[styles.previewShell, isGenerating ? styles.previewGenerating : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <SignPreview
        design={design}
        size={size}
        ariaLabel={ariaLabel}
        showMockDisclaimer={showMockDisclaimer}
        className={className}
        integratedFinalPreview={integratedFinalPreview}
        compositionEditor={compositionEditor}
      />
      <SignGenerationOverlay active={isGenerating} />
    </div>
  );
}
