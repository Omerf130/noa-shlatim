import type { DesignPlaceholderVariant } from "@/data/designPlaceholders";
import styles from "./SignDesignPlaceholder.module.scss";

type SignDesignPlaceholderProps = {
  variant: DesignPlaceholderVariant;
  ariaLabel: string;
  className?: string;
  /** When true, shows a small “sign frame” overlay for preview contexts */
  showSignFrame?: boolean;
};

export function SignDesignPlaceholder({
  variant,
  ariaLabel,
  className,
  showSignFrame = false,
}: SignDesignPlaceholderProps) {
  return (
    <div
      className={[styles.root, styles[variant], className].filter(Boolean).join(" ")}
      role="img"
      aria-label={ariaLabel}
    >
      <div className={styles.pattern} aria-hidden="true" />
      {showSignFrame && (
        <div className={styles.signFrame} aria-hidden="true">
          <span className={styles.signKnob} />
        </div>
      )}
    </div>
  );
}
