import type { ReactNode } from "react";
import styles from "./SectionHeading.module.scss";

type SectionHeadingProps = {
  title: string;
  titleId?: string;
  subtitle?: ReactNode;
  align?: "start" | "center";
  className?: string;
};

export function SectionHeading({
  title,
  titleId,
  subtitle,
  align = "start",
  className,
}: SectionHeadingProps) {
  return (
    <header
      className={[styles.header, styles[align], className]
        .filter(Boolean)
        .join(" ")}
    >
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </header>
  );
}
