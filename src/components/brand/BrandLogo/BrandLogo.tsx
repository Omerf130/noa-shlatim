import Link from "next/link";
import styles from "./BrandLogo.module.scss";

type BrandLogoProps = {
  variant?: "default" | "compact";
  asLink?: boolean;
  className?: string;
};

function PawMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      width={12}
      height={12}
      aria-hidden="true"
    >
      <ellipse cx="8" cy="11" rx="3.2" ry="2.6" fill="currentColor" />
      <circle cx="4.5" cy="6.5" r="1.6" fill="currentColor" />
      <circle cx="8" cy="5" r="1.7" fill="currentColor" />
      <circle cx="11.5" cy="6.5" r="1.6" fill="currentColor" />
    </svg>
  );
}

function NameWordmark() {
  return (
    <span className={styles.name} aria-hidden="false">
      <span className={styles.letter} data-letter="nun">
        נ
      </span>
      <span className={styles.letter} data-letter="vav">
        ו
      </span>
      <span className={styles.letter} data-letter="he">
        ע
        <PawMark className={styles.pawOnHe} />
      </span>
      <span className={styles.letter} data-letter="heh">
        ה
      </span>
      <svg className={styles.underline} viewBox="0 0 120 12" aria-hidden="true">
        <path
          d="M4 8 C 30 2, 50 10, 75 6 S 110 4, 116 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
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
      <NameWordmark />
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
