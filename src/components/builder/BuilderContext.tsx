"use client";

import {
  builderReducer,
  initialBuilderState,
  type BuilderAction,
} from "@/lib/builder/builderReducer";
import type { BuilderState } from "@/types/builder";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";

type BuilderContextValue = {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
  setSourcePhotoFile: (file: File | null) => void;
  getSourcePhotoFile: () => File | null;
};

const BuilderContext = createContext<BuilderContextValue | null>(null);

export function BuilderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(builderReducer, initialBuilderState);
  const sourcePhotoFileRef = useRef<File | null>(null);

  const setSourcePhotoFile = useCallback((file: File | null) => {
    sourcePhotoFileRef.current = file;
  }, []);

  const getSourcePhotoFile = useCallback(() => sourcePhotoFileRef.current, []);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      setSourcePhotoFile,
      getSourcePhotoFile,
    }),
    [state, setSourcePhotoFile, getSourcePhotoFile],
  );

  return (
    <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>
  );
}

export function useBuilder(): BuilderContextValue {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used within BuilderProvider");
  return ctx;
}
