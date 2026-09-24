import Link from "next/link";
import styles from "./BrandLogo.module.scss";

type BrandLogoProps = {
  /** Compact single-line lockup for tight headers */
  variant?: "default" | "compact";
  asLink?: boolean;
  className?: string;
};

function PawMark() {
  return (
    <svg
      className={styles.paw}
      viewBox="0 0 16 16"
      width={14}
      height={14}
      aria-hidden="true"
    >
      <ellipse cx="8" cy="11" rx="3.2" ry="2.6" fill="currentColor" />
      <circle cx="4.5" cy="6.5" r="1.6" fill="currentColor" />
      <circle cx="8" cy="5" r="1.7" fill="currentColor" />
      <circle cx="11.5" cy="6.5" r="1.6" fill="currentColor" />
    </svg>
  );
}

function LogoContent({ variant }: { variant: "default" | "compact" }) {
  return (
    <span
      className={[
        styles.lockup,
        variant === "compact" ? styles.compact : "",
      ].join(" ")}
    >
      <span className={styles.primaryLine}>
        <span className={styles.name}>נועה</span>
        <PawMark />
      </span>
      <span className={styles.tagline}>שלטים לדלת</span>
    </span>
  );
}

export function BrandLogo({
  variant = "default",
  asLink = true,
  className,
}: BrandLogoProps) {
  const content = <LogoContent variant={variant} />;

  if (!asLink) {
    return (
      <div className={[styles.root, className].filter(Boolean).join(" ")}>
        {content}
      </div>
    );
  }

  return (
    <Link
      href="/"
      className={[styles.root, styles.link, className].filter(Boolean).join(" ")}
      aria-label="נועה — שלטים לדלת, דף הבית"
    >
      {content}
    </Link>
  );
}
