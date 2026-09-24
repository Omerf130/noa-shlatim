"use client";

import { BuilderProvider, useBuilder } from "@/components/builder/BuilderContext";
import { BuilderLayout } from "@/components/builder/BuilderLayout/BuilderLayout";
import { BuilderProgress } from "@/components/builder/BuilderProgress/BuilderProgress";
import { BuilderShell } from "@/components/builder/BuilderShell/BuilderShell";
import { BuilderStepContent } from "@/components/builder/BuilderStepContent";
import { revokeObjectUrl } from "@/lib/builder/objectUrl";
import { useEffect, useRef } from "react";

function SignBuilderInner() {
  const { state } = useBuilder();
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

export function SignBuilder() {
  return (
    <BuilderProvider>
      <SignBuilderInner />
    </BuilderProvider>
  );
}
