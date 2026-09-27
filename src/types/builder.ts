import type { SignDesignState } from "./signDesign";

export type BuilderStepId =
  | "start"
  | "upload"
  | "illustrationStyle"
  | "design"
  | "review";

export type AiGenerationStatus = "idle" | "generating" | "success" | "error";

export type DesignWorkspaceTab = "background" | "text" | "image" | "material";

export type DesignSelectedElement =
  | { kind: "text" }
  | { kind: "illustration" }
  | { kind: "decoration"; id: string };

export type BuilderUiState = {
  currentStepId: BuilderStepId;
  checkoutMessageVisible: boolean;
  aiIllustration: {
    status: AiGenerationStatus;
    errorCode?: string;
    userMessage?: string;
  };
  designWorkspace: {
    activeTab: DesignWorkspaceTab;
    selectedElement: DesignSelectedElement | null;
  };
};

export type BuilderState = {
  design: SignDesignState;
  ui: BuilderUiState;
};

export const initialDesignWorkspaceUi = {
  activeTab: "background" as const,
  selectedElement: null,
};

export const initialBuilderUiState: BuilderUiState = {
  currentStepId: "start",
  checkoutMessageVisible: false,
  aiIllustration: {
    status: "idle",
  },
  designWorkspace: { ...initialDesignWorkspaceUi },
};
