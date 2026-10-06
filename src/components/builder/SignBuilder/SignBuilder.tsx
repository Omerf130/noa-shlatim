"use client";

import { BuilderProvider, useBuilder } from "@/components/builder/BuilderContext";
import { BuilderLayout } from "@/components/builder/BuilderLayout/BuilderLayout";
import { BuilderProgress } from "@/components/builder/BuilderProgress/BuilderProgress";
import { BuilderShell } from "@/components/builder/BuilderShell/BuilderShell";
import { BuilderStepContent } from "@/components/builder/BuilderStepContent";
import { useBackgroundCatalogSync } from "@/hooks/useBackgroundCatalogSync";
import { useMaterialAvailabilitySync } from "@/hooks/useMaterialAvailabilitySync";
import { revokeObjectUrl } from "@/lib/builder/objectUrl";
import type { MaterialAvailability } from "@/lib/store/materialAvailability";
import type { SignBackground } from "@/types/signBackground";
import { useEffect, useRef } from "react";

function SignBuilderInner() {
  const { state } = useBuilder();
  useMaterialAvailabilitySync();
  useBackgroundCatalogSync();
  const designRef = useRef(state.design);

  useEffect(() => {
    designRef.current = state.design;
  }, [state.design]);

  useEffect(() => {
    return () => {
      const { originalImage, illustration } = designRef.current;
      if (originalImage) revokeObjectUrl(originalImage.objectUrl);
      if (illustration && illustration.objectUrl !== originalImage?.objectUrl) {
        revokeObjectUrl(illustration.objectUrl);
      }
    };
  }, []);

  return (
    <BuilderShell>
      <BuilderProgress />
      <BuilderLayout>
        <BuilderStepContent />
      </BuilderLayout>
    </BuilderShell>
  );
}

type SignBuilderProps = {
  materialAvailability: MaterialAvailability;
  customerBackgrounds: SignBackground[];
};

export function SignBuilder({ materialAvailability, customerBackgrounds }: SignBuilderProps) {
  return (
    <BuilderProvider
      materialAvailability={materialAvailability}
      customerBackgrounds={customerBackgrounds}
    >
      <SignBuilderInner />
    </BuilderProvider>
  );
}
