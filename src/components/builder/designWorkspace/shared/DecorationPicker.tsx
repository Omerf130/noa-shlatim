"use client";

import { SignDecorationSvg } from "@/components/sign/decorations/SignDecorationSvg";
import { signDecorationCatalog } from "@/data/signDecorations";
import type { DecorationTypeId } from "@/types/signDesign";
import { useEffect, useRef, useState } from "react";
import styles from "./decorationControls.module.scss";

type DecorationPickerProps = {
  onPick: (type: DecorationTypeId) => void;
  triggerClassName?: string;
};

export function DecorationPicker({ onPick, triggerClassName }: DecorationPickerProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);

  return (
    <div className={styles.pickerWrap} ref={wrapRef}>
      <button
        type="button"
        className={[styles.decorTrigger, triggerClassName].filter(Boolean).join(" ")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="הוספת קישוט"
        onClick={() => setOpen((v) => !v)}
      >
        <SignDecorationSvg type="sparkle" className={styles.decorTriggerIcon} />
      </button>
      {open && (
        <div
          className={styles.pickerPopover}
          role="dialog"
          aria-label="בחירת קישוט"
        >
          <div className={styles.pickerGrid}>
            {signDecorationCatalog.map((item) => (
              <button
                key={item.id}
                type="button"
                className={styles.pickerItem}
                onClick={() => {
                  onPick(item.id);
                  setOpen(false);
                }}
              >
                <SignDecorationSvg
                  type={item.id}
                  className={styles.pickerItemIcon}
                  style={{ color: item.defaultColor }}
                />
                <span className={styles.pickerItemLabel}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
