import type { SignDesignState } from "./signDesign";

export type BuilderStepId =
  | "start"
  | "upload"
  | "illustrationStyle"
  | "design"
  | "review";

export type BuilderUiState = {
  currentStepId: BuilderStepId;
  checkoutMessageVisible: boolean;
};

export type BuilderState = {
  design: SignDesignState;
  ui: BuilderUiState;
};

export const initialBuilderUiState: BuilderUiState = {
  currentStepId: "start",
  checkoutMessageVisible: false,
};
