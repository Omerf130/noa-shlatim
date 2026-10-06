"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import { resolveSyncedMaterialSelection } from "@/lib/builder/materialSelection";
import { useEffect } from "react";

export function useMaterialAvailabilitySync(): void {
  const { state, dispatch, materialAvailability } = useBuilder();

  useEffect(() => {
    const next = resolveSyncedMaterialSelection(
      state.design.material,
      materialAvailability,
    );
    if (next !== state.design.material) {
      dispatch({ type: "SET_MATERIAL", material: next });
    }
  }, [dispatch, materialAvailability, state.design.material]);
}
