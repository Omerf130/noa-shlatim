"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import { listActiveBackgrounds } from "@/data/signBackgrounds";
import Image from "next/image";
import styles from "./mobileEditor.module.scss";

function thumbnailSrc(bg: { thumbnailSrc?: string; imageSrc: string }): string {
  return bg.thumbnailSrc ?? bg.imageSrc;
}

export function MobileBackgroundRail() {
  const { state, dispatch } = useBuilder();
  const selected = state.design.backgroundId;
  const backgrounds = listActiveBackgrounds();

  return (
    <ul className={styles.bgRail} role="radiogroup" aria-label="בחירת רקע">
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
              className={[styles.bgThumb, isSelected ? styles.bgThumbSelected : ""]
                .filter(Boolean)
                .join(" ")}
              onClick={() =>
                dispatch({ type: "SET_BACKGROUND", backgroundId: bg.id })
              }
            >
              <span className={styles.bgThumbVisual}>
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="84px"
                  className={styles.bgThumbImage}
                  style={{ objectPosition: bg.objectPosition ?? "50% 50%" }}
                />
              </span>
              <span className={styles.bgThumbLabel}>{bg.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
