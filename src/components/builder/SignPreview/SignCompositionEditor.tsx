"use client";

import { SignPreview } from "@/components/builder/SignPreview/SignPreview";
import { useBuilder } from "@/components/builder/BuilderContext";
import { resolveSignPreviewArtworkConfig } from "@/lib/builder/signPreviewConfig";
import type { SignPreviewSize } from "@/components/builder/SignPreview/SignPreview";
import type { DesignSelectedElement, DesignWorkspaceTab } from "@/types/builder";

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
    <SignPreview
      design={design}
      size={size}
      ariaLabel={ariaLabel}
      showMockDisclaimer={showMockDisclaimer}
      className={className}
      integratedFinalPreview={integratedFinalPreview}
      compositionEditor={{
        activeTab,
        selectedElement,
        onSelectElement: (element: DesignSelectedElement | null) =>
          dispatch({ type: "SET_DESIGN_SELECTED_ELEMENT", element }),
        onFocusTool: (tab: DesignWorkspaceTab) =>
          dispatch({ type: "SET_DESIGN_WORKSPACE_TAB", tab }),
        onIllustrationTransformPatch: (patch) =>
          dispatch({ type: "SET_ILLUSTRATION_TRANSFORM", patch }),
        onTextPatch: (patch) => dispatch({ type: "SET_TEXT", patch }),
        onDecorationPatch: (id, patch) =>
          dispatch({ type: "UPDATE_DECORATION", id, patch }),
      }}
    />
  );
}
