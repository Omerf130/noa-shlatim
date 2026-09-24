import type { BuilderState, BuilderStepId } from "@/types/builder";
import type {
  CreationMode,
  IllustrationAsset,
  IllustrationTransform,
  LocalImageRef,
  Material,
  SignDesignState,
  TextDesign,
} from "@/types/signDesign";
import {
  defaultIllustrationTransform,
  defaultTextDesign,
  initialSignDesignState,
} from "@/types/signDesign";
import { initialBuilderUiState } from "@/types/builder";
import { getNextStep, getPrevStep } from "./steps";
import { revokeObjectUrl } from "./objectUrl";

export type BuilderAction =
  | { type: "SET_CREATION_MODE"; mode: CreationMode }
  | { type: "SET_UPLOAD"; image: LocalImageRef }
  | { type: "CLEAR_UPLOAD" }
  | { type: "SET_ILLUSTRATION_STYLE"; styleId: string }
  | { type: "SET_BACKGROUND"; backgroundId: string }
  | { type: "SET_TEXT"; patch: Partial<TextDesign> }
  | { type: "SET_ILLUSTRATION_TRANSFORM"; patch: Partial<IllustrationTransform> }
  | { type: "SET_MATERIAL"; material: Material }
  | { type: "GO_NEXT" }
  | { type: "GO_BACK" }
  | { type: "GO_TO_STEP"; stepId: BuilderStepId }
  | { type: "SHOW_CHECKOUT_MESSAGE" };

export const initialBuilderState: BuilderState = {
  design: initialSignDesignState,
  ui: initialBuilderUiState,
};

function resetAfterModeChange(): SignDesignState {
  return {
    ...initialSignDesignState,
    text: { ...defaultTextDesign },
    illustrationTransform: { ...defaultIllustrationTransform },
  };
}

function revokeDesignUrls(design: SignDesignState): void {
  const urls = new Set<string>();
  if (design.originalImage) urls.add(design.originalImage.objectUrl);
  if (
    design.illustration &&
    design.illustration.objectUrl !== design.originalImage?.objectUrl
  ) {
    urls.add(design.illustration.objectUrl);
  }
  urls.forEach(revokeObjectUrl);
}

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "SET_CREATION_MODE": {
      if (state.design.creationMode === action.mode) {
        return { ...state, design: { ...state.design, creationMode: action.mode } };
      }
      revokeDesignUrls(state.design);
      return {
        ...state,
        design: { ...resetAfterModeChange(), creationMode: action.mode },
        ui: { ...state.ui, currentStepId: "start", checkoutMessageVisible: false },
      };
    }

    case "SET_UPLOAD": {
      revokeDesignUrls(state.design);
      const mode = state.design.creationMode;
      let illustration: IllustrationAsset | null = null;
      if (mode === "illustration") {
        illustration = {
          objectUrl: action.image.objectUrl,
          source: "upload",
          styleId: null,
        };
      }
      return {
        ...state,
        design: {
          ...state.design,
          originalImage: action.image,
          illustration,
        },
      };
    }

    case "CLEAR_UPLOAD": {
      revokeDesignUrls(state.design);
      return {
        ...state,
        design: {
          ...state.design,
          originalImage: null,
          illustration: null,
        },
      };
    }

    case "SET_ILLUSTRATION_STYLE": {
      if (!state.design.originalImage) return state;
      const illustration: IllustrationAsset = {
        objectUrl: state.design.originalImage.objectUrl,
        source: "mockAi",
        styleId: action.styleId,
      };
      return {
        ...state,
        design: { ...state.design, illustration },
      };
    }

    case "SET_BACKGROUND":
      return {
        ...state,
        design: { ...state.design, backgroundId: action.backgroundId },
      };

    case "SET_TEXT":
      return {
        ...state,
        design: {
          ...state.design,
          text: { ...state.design.text, ...action.patch },
        },
      };

    case "SET_ILLUSTRATION_TRANSFORM":
      return {
        ...state,
        design: {
          ...state.design,
          illustrationTransform: {
            ...state.design.illustrationTransform,
            ...action.patch,
          },
        },
      };

    case "SET_MATERIAL":
      return {
        ...state,
        design: { ...state.design, material: action.material },
      };

    case "GO_NEXT": {
      const next = getNextStep(state.design.creationMode, state.ui.currentStepId);
      if (!next) return state;
      return {
        ...state,
        ui: { ...state.ui, currentStepId: next },
      };
    }

    case "GO_BACK": {
      const prev = getPrevStep(state.design.creationMode, state.ui.currentStepId);
      if (!prev) return state;
      return {
        ...state,
        ui: {
          ...state.ui,
          currentStepId: prev,
          checkoutMessageVisible: false,
        },
      };
    }

    case "GO_TO_STEP":
      return {
        ...state,
        ui: {
          ...state.ui,
          currentStepId: action.stepId,
          checkoutMessageVisible: false,
        },
      };

    case "SHOW_CHECKOUT_MESSAGE":
      return {
        ...state,
        ui: { ...state.ui, checkoutMessageVisible: true },
      };

    default:
      return state;
  }
}
