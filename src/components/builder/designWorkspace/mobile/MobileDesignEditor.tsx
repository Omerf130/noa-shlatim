"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import { SignCompositionEditor } from "@/components/builder/SignPreview/SignCompositionEditor";
import { MobileBackgroundRail } from "@/components/builder/designWorkspace/mobile/MobileBackgroundRail";
import { MobileIllustrationControls } from "@/components/builder/designWorkspace/mobile/MobileIllustrationControls";
import { MobileMaterialPicker } from "@/components/builder/designWorkspace/mobile/MobileMaterialPicker";
import { MobileTextControls } from "@/components/builder/designWorkspace/mobile/MobileTextControls";
import { DraftEditReassurance } from "@/components/builder/designWorkspace/DraftEditReassurance";
import styles from "./mobileEditor.module.scss";

type MobileDesignTab = "background" | "text" | "image" | "material";

const tools: { id: MobileDesignTab; label: string }[] = [
  { id: "background", label: "רקע" },
  { id: "text", label: "טקסט" },
  { id: "image", label: "תמונה" },
  { id: "material", label: "חומר" },
];

export function MobileDesignEditor() {
  const { state, dispatch } = useBuilder();
  const activeTab = state.ui.designWorkspace.activeTab;
  const { design } = state;
  const showMockDisclaimer = design.illustration?.source === "mockAi";

  return (
    <div className={styles.shell}>
      <div className={styles.stage}>
        <div className={styles.stageInner}>
          <SignCompositionEditor size="mobileStage" ariaLabel="תצוגת השלט" />
        </div>
      </div>

      <DraftEditReassurance />

      <div className={styles.console}>
        <div className={styles.toolbar} role="tablist" aria-label="כלי עיצוב">
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              role="tab"
              id={`mobile-tab-${tool.id}`}
              aria-selected={activeTab === tool.id}
              aria-controls={`mobile-panel-${tool.id}`}
              className={[
                styles.toolBtn,
                activeTab === tool.id ? styles.toolBtnActive : "",
              ].join(" ")}
              onClick={() =>
                dispatch({ type: "SET_DESIGN_WORKSPACE_TAB", tab: tool.id })
              }
            >
              {tool.label}
            </button>
          ))}
        </div>

        <div
          id={`mobile-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`mobile-tab-${activeTab}`}
          className={styles.dock}
        >
          {activeTab === "background" && <MobileBackgroundRail />}
          {activeTab === "text" && <MobileTextControls />}
          {activeTab === "image" && <MobileIllustrationControls />}
          {activeTab === "material" && <MobileMaterialPicker />}
        </div>

        {showMockDisclaimer && (
          <p className={styles.mockNote} role="note">
            תצוגת האיור זמנית — לא מייצגת את האיור שיווצר בשלב הבא.
          </p>
        )}
      </div>
    </div>
  );
}
