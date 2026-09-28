import type { SignDesignState } from "./signDesign";

export type BuilderStepId =
  | "start"
  | "background"
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

export type FinalSignPreviewMode = "draft" | "final";

export type FinalSignArtworkUi = {
  status: AiGenerationStatus;
  objectUrl: string | null;
  isValid: boolean;
  previewMode: FinalSignPreviewMode;
  errorCode?: string;
  userMessage?: string;
};

export type BuilderUiState = {
  currentStepId: BuilderStepId;
  checkoutMessageVisible: boolean;
  aiIllustration: {
    status: AiGenerationStatus;
    errorCode?: string;
    userMessage?: string;
  };
  finalSignArtwork: FinalSignArtworkUi;
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

export const initialFinalSignArtworkUi: FinalSignArtworkUi = {
  status: "idle",
  objectUrl: null,
  isValid: false,
  previewMode: "draft",
};

export const initialBuilderUiState: BuilderUiState = {
  currentStepId: "start",
  checkoutMessageVisible: false,
  aiIllustration: {
    status: "idle",
  },
  finalSignArtwork: { ...initialFinalSignArtworkUi },
  designWorkspace: { ...initialDesignWorkspaceUi },
};
