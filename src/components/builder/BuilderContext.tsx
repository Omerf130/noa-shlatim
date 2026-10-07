"use client";

import {
  builderReducer,
  initialBuilderState,
  type BuilderAction,
} from "@/lib/builder/builderReducer";
import type { CustomerMagnetCatalog } from "@/lib/store/loadCustomerMagnetCatalog";
import type { MaterialAvailability } from "@/lib/store/materialAvailability";
import type { BuilderState } from "@/types/builder";
import type { SignBackground } from "@/types/signBackground";
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
  materialAvailability: MaterialAvailability;
  customerMagnetCatalog: CustomerMagnetCatalog;
  customerBackgrounds: SignBackground[];
  dispatch: React.Dispatch<BuilderAction>;
  setSourcePhotoFile: (file: File | null) => void;
  getSourcePhotoFile: () => File | null;
  setFinalArtworkBlob: (blob: Blob | null) => void;
  getFinalArtworkBlob: () => Blob | null;
};

export const BuilderContext = createContext<BuilderContextValue | null>(null);

type BuilderProviderProps = {
  children: ReactNode;
  materialAvailability: MaterialAvailability;
  customerMagnetCatalog: CustomerMagnetCatalog;
  customerBackgrounds: SignBackground[];
};

export function BuilderProvider({
  children,
  materialAvailability,
  customerMagnetCatalog,
  customerBackgrounds,
}: BuilderProviderProps) {
  const [state, dispatch] = useReducer(builderReducer, initialBuilderState);
  const sourcePhotoFileRef = useRef<File | null>(null);
  const finalArtworkBlobRef = useRef<Blob | null>(null);

  const setSourcePhotoFile = useCallback((file: File | null) => {
    sourcePhotoFileRef.current = file;
  }, []);

  const getSourcePhotoFile = useCallback(() => sourcePhotoFileRef.current, []);

  const setFinalArtworkBlob = useCallback((blob: Blob | null) => {
    finalArtworkBlobRef.current = blob;
  }, []);

  const getFinalArtworkBlob = useCallback(() => finalArtworkBlobRef.current, []);

  const value = useMemo(
    () => ({
      state,
      materialAvailability,
      customerMagnetCatalog,
      customerBackgrounds,
      dispatch,
      setSourcePhotoFile,
      getSourcePhotoFile,
      setFinalArtworkBlob,
      getFinalArtworkBlob,
    }),
    [
      state,
      materialAvailability,
      customerMagnetCatalog,
      customerBackgrounds,
      setSourcePhotoFile,
      getSourcePhotoFile,
      setFinalArtworkBlob,
      getFinalArtworkBlob,
    ],
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
