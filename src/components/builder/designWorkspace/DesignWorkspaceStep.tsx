"use client";

import { BackgroundPanel } from "@/components/builder/designWorkspace/panels/BackgroundPanel";
import { ImagePanel } from "@/components/builder/designWorkspace/panels/ImagePanel";
import { MaterialPanel } from "@/components/builder/designWorkspace/panels/MaterialPanel";
import { TextPanel } from "@/components/builder/designWorkspace/panels/TextPanel";
import { useState } from "react";
import styles from "./DesignWorkspaceStep.module.scss";

type DesignTab = "background" | "text" | "image" | "material";

const tabs: { id: DesignTab; label: string }[] = [
  { id: "background", label: "רקע" },
  { id: "text", label: "טקסט" },
  { id: "image", label: "תמונה" },
  { id: "material", label: "חומר" },
];

export function DesignWorkspaceStep() {
  const [activeTab, setActiveTab] = useState<DesignTab>("background");

  return (
    <div className={styles.workspace}>
      <header className={styles.header}>
        <h2 className={styles.title}>עיצוב השלט</h2>
        <p className={styles.subtitle}>התאימו רקע, טקסט, תמונה וחומר — הכל במקום אחד.</p>
      </header>

      <div
        className={styles.tabs}
        role="tablist"
        aria-label="אפשרויות עיצוב"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            className={[styles.tab, activeTab === tab.id ? styles.tabActive : ""]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className={styles.panelArea}
      >
        {activeTab === "background" && <BackgroundPanel />}
        {activeTab === "text" && <TextPanel />}
        {activeTab === "image" && <ImagePanel />}
        {activeTab === "material" && <MaterialPanel />}
      </div>
    </div>
  );
}
