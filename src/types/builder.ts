import type { SignDesignState } from "./signDesign";

export type BuilderStepId =
  | "start"
  | "upload"
  | "illustrationStyle"
  | "design"
  | "review";

export type AiGenerationStatus = "idle" | "generating" | "success" | "error";

export type BuilderUiState = {
  currentStepId: BuilderStepId;
  checkoutMessageVisible: boolean;
  aiIllustration: {
    status: AiGenerationStatus;
    errorCode?: string;
    userMessage?: string;
  };
};

export type BuilderState = {
  design: SignDesignState;
  ui: BuilderUiState;
};

export const initialBuilderUiState: BuilderUiState = {
  currentStepId: "start",
  checkoutMessageVisible: false,
  aiIllustration: {
    status: "idle",
  },
};
