"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import { resolveSyncedBackgroundSelection } from "@/lib/builder/backgroundSelection";
import { useEffect } from "react";

export function useBackgroundCatalogSync(): void {
  const { state, dispatch, customerBackgrounds } = useBuilder();

  useEffect(() => {
    const next = resolveSyncedBackgroundSelection(
      state.design.backgroundId,
      customerBackgrounds,
    );
    if (next !== state.design.backgroundId) {
      dispatch({ type: "SET_BACKGROUND", backgroundId: next });
    }
  }, [customerBackgrounds, dispatch, state.design.backgroundId]);
}
