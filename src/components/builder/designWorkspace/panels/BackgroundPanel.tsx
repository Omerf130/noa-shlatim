"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import { listActiveBackgrounds } from "@/data/signBackgrounds";
import Image from "next/image";
import styles from "./panels.module.scss";

function thumbnailSrc(bg: { thumbnailSrc?: string; imageSrc: string }): string {
  return bg.thumbnailSrc ?? bg.imageSrc;
}

export function BackgroundPanel() {
  const { state, dispatch } = useBuilder();
  const selected = state.design.backgroundId;
  const backgrounds = listActiveBackgrounds();

  return (
    <div className={styles.panel} role="radiogroup" aria-label="בחירת רקע">
      <p className={styles.panelIntro}>בחרו רקע — השינוי יופיע מיד על השלט.</p>
      <ul className={styles.thumbGrid}>
        {backgrounds.map((bg) => {
          const isSelected = selected === bg.id;
          const src = thumbnailSrc(bg);
          return (
            <li key={bg.id}>
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={bg.name}
                className={[styles.thumb, isSelected ? styles.thumbSelected : ""]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() =>
                  dispatch({ type: "SET_BACKGROUND", backgroundId: bg.id })
                }
              >
                <span className={styles.thumbVisual}>
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 28vw, 120px"
                    className={styles.thumbImage}
                    style={{ objectPosition: bg.objectPosition ?? "50% 50%" }}
                  />
                </span>
                <span className={styles.thumbLabel}>{bg.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
