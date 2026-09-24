"use client";

import { DesignWorkspaceStep } from "@/components/builder/designWorkspace/DesignWorkspaceStep";
import { useBuilder } from "@/components/builder/BuilderContext";
import { IllustrationStyleStep } from "@/components/builder/steps/IllustrationStyleStep";
import { ReviewStep } from "@/components/builder/steps/ReviewStep";
import { StartStep } from "@/components/builder/steps/StartStep";
import { UploadStep } from "@/components/builder/steps/UploadStep";

export function BuilderStepContent() {
  const { state } = useBuilder();
  const step = state.ui.currentStepId;

  switch (step) {
    case "start":
      return <StartStep />;
    case "upload":
      return <UploadStep />;
    case "illustrationStyle":
      return <IllustrationStyleStep />;
    case "design":
      return <DesignWorkspaceStep />;
    case "review":
      return <ReviewStep />;
    default:
      return null;
  }
}
