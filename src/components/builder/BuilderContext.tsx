"use client";

import {
  builderReducer,
  initialBuilderState,
  type BuilderAction,
} from "@/lib/builder/builderReducer";
import type { BuilderState } from "@/types/builder";
import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

type BuilderContextValue = {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
};

const BuilderContext = createContext<BuilderContextValue | null>(null);

export function BuilderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(builderReducer, initialBuilderState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return (
    <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>
  );
}

export function useBuilder(): BuilderContextValue {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used within BuilderProvider");
  return ctx;
}
