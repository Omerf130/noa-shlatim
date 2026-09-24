"use client";

import { BuilderNavigation } from "@/components/builder/BuilderNavigation/BuilderNavigation";
import { SignPreview } from "@/components/builder/SignPreview/SignPreview";
import { useBuilder } from "@/components/builder/BuilderContext";
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
      {isDesign && (
        <div className={styles.mobileDesignPreview}>
          <SignPreview
            design={design}
            size="compact"
            showMockDisclaimer={showMockDisclaimer}
          />
        </div>
      )}

      {isReview && (
        <div className={styles.reviewHeroPreview}>
          <SignPreview
            design={design}
            size="hero"
            showMockDisclaimer={showMockDisclaimer}
          />
        </div>
      )}

      <div className={styles.mainRow}>
        {isDesign && (
          <aside className={styles.designPreviewColumn} aria-label="תצוגת השלט">
            <SignPreview
              design={design}
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

      {!isReview && <BuilderNavigation className={styles.mobileStickyNav} />}
    </div>
  );
}
