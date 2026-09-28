"use client";

import { listActiveBackgrounds } from "@/data/signBackgrounds";
import Image from "next/image";
import styles from "@/components/builder/designWorkspace/panels/panels.module.scss";

function thumbnailSrc(bg: { thumbnailSrc?: string; imageSrc: string }): string {
  return bg.thumbnailSrc ?? bg.imageSrc;
}

type BackgroundPickerProps = {
  selectedId: string | null;
  onSelect: (backgroundId: string) => void;
};

export function BackgroundPicker({ selectedId, onSelect }: BackgroundPickerProps) {
  const backgrounds = listActiveBackgrounds();

  return (
    <ul className={styles.thumbGrid}>
      {backgrounds.map((bg) => {
        const isSelected = selectedId === bg.id;
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
              onClick={() => onSelect(bg.id)}
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
  );
}
