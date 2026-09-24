import type { DesignPlaceholderVariant } from "@/data/designPlaceholders";
import { SignBackgroundLayer } from "@/components/sign/SignBackgroundLayer/SignBackgroundLayer";
import styles from "./SignDesignPlaceholder.module.scss";

type SignDesignPlaceholderProps = {
  variant: DesignPlaceholderVariant;
  ariaLabel: string;
  className?: string;
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
      className={[styles.root, className].filter(Boolean).join(" ")}
      role="img"
      aria-label={ariaLabel}
    >
      <SignBackgroundLayer variant={variant} />
      {showSignFrame && (
        <div className={styles.signFrame} aria-hidden="true">
          <span className={styles.signKnob} />
        </div>
      )}
    </div>
  );
}
