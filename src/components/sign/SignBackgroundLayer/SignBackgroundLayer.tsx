import type { SignBackgroundVariant } from "@/data/signBackgrounds";
import styles from "./SignBackgroundLayer.module.scss";

type SignBackgroundLayerProps = {
  variant: SignBackgroundVariant;
  className?: string;
};

export function SignBackgroundLayer({ variant, className }: SignBackgroundLayerProps) {
  return (
    <div
      className={[styles.layer, styles[variant], className].filter(Boolean).join(" ")}
      aria-hidden="true"
    />
  );
}
