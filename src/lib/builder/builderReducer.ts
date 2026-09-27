import type {
  BuilderState,
  BuilderStepId,
  DesignSelectedElement,
  DesignWorkspaceTab,
} from "@/types/builder";
import { selectedElementForTab } from "@/lib/sign/designWorkspaceSelection";
import { defaultColorForDecorationType } from "@/data/signDecorations";
import { duplicateDecorationOffset, spawnDecorationPosition } from "@/lib/sign/decorationSpawn";
import {
  clampDecorationScale,
  clampDecorationXY,
} from "@/lib/sign/compositionBounds";
import type {
  CreationMode,
  DecorationInstance,
  DecorationTypeId,
  IllustrationTransform,
  LocalImageRef,
  Material,
  SignDesignState,
  TextDesign,
} from "@/types/signDesign";
import {
  defaultDecorationScale,
  defaultIllustrationTransform,
  defaultTextDesign,
  initialSignDesignState,
} from "@/types/signDesign";
import { initialBuilderUiState } from "@/types/builder";
import { getNextStep, getPrevStep } from "./steps";
import { revokeObjectUrl } from "./objectUrl";
import { revokeIllustrationIfNeeded } from "./revokeIllustrationUrl";

export type BuilderAction =
  | { type: "SET_CREATION_MODE"; mode: CreationMode }
  | { type: "SET_UPLOAD"; image: LocalImageRef }
  | { type: "CLEAR_UPLOAD" }
  | { type: "SET_ILLUSTRATION_STYLE"; styleId: string }
  | { type: "SET_AI_ILLUSTRATION"; objectUrl: string }
  | { type: "SET_MOCK_ILLUSTRATION" }
  | { type: "AI_GENERATION_START" }
  | { type: "AI_GENERATION_ERROR"; errorCode: string; userMessage: string }
  | { type: "SET_BACKGROUND"; backgroundId: string }
  | { type: "SET_TEXT"; patch: Partial<TextDesign> }
  | { type: "SET_ILLUSTRATION_TRANSFORM"; patch: Partial<IllustrationTransform> }
  | { type: "SET_MATERIAL"; material: Material }
  | { type: "GO_NEXT" }
  | { type: "GO_BACK" }
  | { type: "GO_TO_STEP"; stepId: BuilderStepId }
  | { type: "SHOW_CHECKOUT_MESSAGE" }
  | { type: "SET_DESIGN_WORKSPACE_TAB"; tab: DesignWorkspaceTab }
  | { type: "SET_DESIGN_SELECTED_ELEMENT"; element: DesignSelectedElement | null }
  | {
      type: "SET_DESIGN_WORKSPACE_FOCUS";
      tab: DesignWorkspaceTab;
      selectedElement: DesignSelectedElement | null;
    }
  | { type: "ADD_DECORATION"; decorationType: DecorationTypeId }
  | {
      type: "UPDATE_DECORATION";
      id: string;
      patch: Partial<Pick<DecorationInstance, "x" | "y" | "scale" | "color">>;
    }
  | { type: "DELETE_DECORATION"; id: string }
  | { type: "DUPLICATE_DECORATION"; id: string };

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

function clearPhotoPathIllustration(state: BuilderState): SignDesignState {
  revokeIllustrationIfNeeded(
    state.design.illustration,
    state.design.originalImage?.objectUrl,
  );
  return {
    ...state.design,
    illustration: null,
  };
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
        ui: { ...initialBuilderUiState, currentStepId: "start" },
      };
    }

    case "SET_UPLOAD": {
      revokeDesignUrls(state.design);
      const mode = state.design.creationMode;
      let illustration = null;
      if (mode === "illustration") {
        illustration = {
          objectUrl: action.image.objectUrl,
          source: "upload" as const,
          styleId: null,
        };
      }
      return {
        ...state,
        design: {
          ...state.design,
          originalImage: action.image,
          photoIllustrationStyleId: null,
          illustration,
        },
        ui: {
          ...state.ui,
          aiIllustration: { status: "idle" },
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
          photoIllustrationStyleId: null,
          illustration: null,
        },
        ui: {
          ...state.ui,
          aiIllustration: { status: "idle" },
        },
      };
    }

    case "SET_ILLUSTRATION_STYLE": {
      if (!state.design.originalImage) return state;
      const styleChanged = state.design.photoIllustrationStyleId !== action.styleId;
      let design = state.design;
      if (styleChanged) {
        design = clearPhotoPathIllustration(state);
        design = { ...design, photoIllustrationStyleId: action.styleId };
        return {
          ...state,
          design,
          ui: {
            ...state.ui,
            aiIllustration: { status: "idle" },
          },
        };
      }
      return {
        ...state,
        design: { ...state.design, photoIllustrationStyleId: action.styleId },
      };
    }

    case "SET_AI_ILLUSTRATION": {
      const styleId = state.design.photoIllustrationStyleId;
      if (!styleId) return state;
      revokeIllustrationIfNeeded(
        state.design.illustration,
        state.design.originalImage?.objectUrl,
      );
      return {
        ...state,
        design: {
          ...state.design,
          illustration: {
            objectUrl: action.objectUrl,
            source: "ai",
            styleId,
          },
        },
        ui: {
          ...state.ui,
          aiIllustration: { status: "success" },
        },
      };
    }

    case "SET_MOCK_ILLUSTRATION": {
      const styleId = state.design.photoIllustrationStyleId;
      if (!state.design.originalImage || !styleId) return state;
      revokeIllustrationIfNeeded(
        state.design.illustration,
        state.design.originalImage.objectUrl,
      );
      return {
        ...state,
        design: {
          ...state.design,
          illustration: {
            objectUrl: state.design.originalImage.objectUrl,
            source: "mockAi",
            styleId,
          },
        },
        ui: {
          ...state.ui,
          aiIllustration: { status: "success" },
        },
      };
    }

    case "AI_GENERATION_START":
      return {
        ...state,
        ui: {
          ...state.ui,
          aiIllustration: { status: "generating" },
        },
      };

    case "AI_GENERATION_ERROR":
      return {
        ...state,
        ui: {
          ...state.ui,
          aiIllustration: {
            status: "error",
            errorCode: action.errorCode,
            userMessage: action.userMessage,
          },
        },
      };

    case "SET_BACKGROUND":
      return {
        ...state,
        design: { ...state.design, backgroundId: action.backgroundId },
      };

    case "SET_TEXT": {
      const { patch } = action;
      const resetsOffsets =
        "position" in patch &&
        patch.position !== undefined &&
        !("offsetX" in patch) &&
        !("offsetY" in patch);
      const nextText = {
        ...state.design.text,
        ...patch,
        ...(resetsOffsets ? { offsetX: 0, offsetY: 0 } : {}),
      };
      return {
        ...state,
        design: {
          ...state.design,
          text: nextText,
        },
      };
    }

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

    case "ADD_DECORATION": {
      const count = state.design.decorations.length;
      const { x, y } = spawnDecorationPosition(count);
      const id = crypto.randomUUID();
      const instance: DecorationInstance = {
        id,
        type: action.decorationType,
        x,
        y,
        scale: defaultDecorationScale,
        color: defaultColorForDecorationType(action.decorationType),
      };
      return {
        ...state,
        design: {
          ...state.design,
          decorations: [...state.design.decorations, instance],
        },
        ui: {
          ...state.ui,
          designWorkspace: {
            activeTab: "text",
            selectedElement: { kind: "decoration", id },
          },
        },
      };
    }

    case "UPDATE_DECORATION": {
      const decorations = state.design.decorations.map((d) => {
        if (d.id !== action.id) return d;
        const next = { ...d, ...action.patch };
        const xy = clampDecorationXY(next.x, next.y);
        return {
          ...next,
          x: xy.x,
          y: xy.y,
          scale: clampDecorationScale(next.scale),
        };
      });
      return {
        ...state,
        design: { ...state.design, decorations },
      };
    }

    case "DELETE_DECORATION": {
      const decorations = state.design.decorations.filter((d) => d.id !== action.id);
      const selected = state.ui.designWorkspace.selectedElement;
      const clearSelection =
        selected?.kind === "decoration" && selected.id === action.id;
      return {
        ...state,
        design: { ...state.design, decorations },
        ui: clearSelection
          ? {
              ...state.ui,
              designWorkspace: {
                ...state.ui.designWorkspace,
                selectedElement: null,
              },
            }
          : state.ui,
      };
    }

    case "DUPLICATE_DECORATION": {
      const source = state.design.decorations.find((d) => d.id === action.id);
      if (!source) return state;
      const { x, y } = duplicateDecorationOffset(source.x, source.y);
      const id = crypto.randomUUID();
      const clone: DecorationInstance = {
        id,
        type: source.type,
        x,
        y,
        scale: source.scale,
        color: source.color ?? defaultColorForDecorationType(source.type),
      };
      return {
        ...state,
        design: {
          ...state.design,
          decorations: [...state.design.decorations, clone],
        },
        ui: {
          ...state.ui,
          designWorkspace: {
            activeTab: "text",
            selectedElement: { kind: "decoration", id },
          },
        },
      };
    }

    case "SET_DESIGN_WORKSPACE_TAB": {
      const selectedElement = selectedElementForTab(action.tab, state.design);
      return {
        ...state,
        ui: {
          ...state.ui,
          designWorkspace: {
            activeTab: action.tab,
            selectedElement,
          },
        },
      };
    }

    case "SET_DESIGN_SELECTED_ELEMENT":
      return {
        ...state,
        ui: {
          ...state.ui,
          designWorkspace: {
            ...state.ui.designWorkspace,
            selectedElement: action.element,
          },
        },
      };

    case "SET_DESIGN_WORKSPACE_FOCUS":
      return {
        ...state,
        ui: {
          ...state.ui,
          designWorkspace: {
            activeTab: action.tab,
            selectedElement: action.selectedElement,
          },
        },
      };

    case "GO_NEXT": {
      const next = getNextStep(state.design.creationMode, state.ui.currentStepId);
      if (!next) return state;
      return {
        ...state,
        ui: {
          ...state.ui,
          currentStepId: next,
          designWorkspace: {
            ...state.ui.designWorkspace,
            selectedElement: null,
          },
        },
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
