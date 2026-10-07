"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import { resolveSyncedMagnetSizeId } from "@/lib/builder/magnetSizeSelection";
import { useEffect } from "react";

export function useMagnetSizeCatalogSync(): void {
  const { state, dispatch, customerMagnetCatalog } = useBuilder();

  useEffect(() => {
    const next = resolveSyncedMagnetSizeId(
      state.design.magnetSizeId,
      state.design.material,
      customerMagnetCatalog.sizes,
    );
    if (next !== state.design.magnetSizeId) {
      dispatch({ type: "SET_MAGNET_SIZE_ID", magnetSizeId: next });
    }
  }, [
    customerMagnetCatalog.sizes,
    dispatch,
    state.design.material,
    state.design.magnetSizeId,
  ]);
}
