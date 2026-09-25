import { ImageIcon } from "lucide-react";
import styles from "./homeShared.module.scss";

type VisualPlaceholderProps = {
  title: string;
  note?: string;
  aspectRatio?: string;
};

export function VisualPlaceholder({
  title,
  note = "תמונת דוגמה תתווסף בקרוב",
  aspectRatio = "3 / 2",
}: VisualPlaceholderProps) {
  return (
    <div className={styles.placeholderFrame} style={{ aspectRatio }}>
      <ImageIcon size={32} strokeWidth={1.5} className={styles.placeholderIcon} aria-hidden />
      <p className={styles.placeholderTitle}>{title}</p>
      <p className={styles.placeholderNote}>{note}</p>
    </div>
  );
}
