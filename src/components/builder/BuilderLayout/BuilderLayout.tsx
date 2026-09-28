"use client";

import { BuilderNavigation } from "@/components/builder/BuilderNavigation/BuilderNavigation";
import navStyles from "@/components/builder/BuilderNavigation/BuilderNavigation.module.scss";
import { SignCompositionEditor } from "@/components/builder/SignPreview/SignCompositionEditor";
import { SignPreview } from "@/components/builder/SignPreview/SignPreview";
import { useBuilder } from "@/components/builder/BuilderContext";
import { resolveSignPreviewArtworkConfig } from "@/lib/builder/signPreviewConfig";
import type { BuilderStepId } from "@/types/builder";
import type { ReactNode } from "react";
import styles from "./BuilderLayout.module.scss";

type BuilderLayoutProps = {
  children: ReactNode;
};

function showsPreview(step: BuilderStepId): boolean {
  return step === "design" || step === "review";
}

export function BuilderLayout({ children }: BuilderLayoutProps) {
  const { state } = useBuilder();
  const { design, ui } = state;
  const step = ui.currentStepId;
  const showMockDisclaimer = design.illustration?.source === "mockAi";
  const integratedFinalPreview = resolveSignPreviewArtworkConfig(state);
  const isDesign = step === "design";
  const isReview = step === "review";
  const isCentered = !showsPreview(step);

  return (
    <div
      className={[
        styles.layout,
        isCentered ? styles.centered : "",
        isDesign ? styles.designMode : "",
        isReview ? styles.reviewMode : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isReview && (
        <div className={styles.reviewHeroPreview}>
          <SignPreview
            design={design}
            size="hero"
            showMockDisclaimer={showMockDisclaimer}
            integratedFinalPreview={integratedFinalPreview}
          />
        </div>
      )}

      <div className={styles.mainRow}>
        {isDesign && (
          <aside className={styles.designPreviewColumn} aria-label="תצוגת השלט">
            <SignCompositionEditor
              size="workspace"
              showMockDisclaimer={showMockDisclaimer}
            />
          </aside>
        )}

        <div className={styles.controls}>
          {children}
          {!isReview && <BuilderNavigation className={styles.desktopNav} />}
        </div>
      </div>

      {!isReview && (
        <BuilderNavigation
          className={[styles.mobileStickyNav, navStyles.mobileSticky]
            .filter(Boolean)
            .join(" ")}
        />
      )}
    </div>
  );
}
