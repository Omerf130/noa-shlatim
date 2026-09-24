import type { SignBackgroundVariant } from "@/data/signBackgroundVariants";
import type { SignBackground } from "@/types/signBackground";
import styles from "./SignBackgroundLayer.module.scss";

type SignBackgroundLayerImageProps = {
  background: Pick<SignBackground, "imageSrc" | "alt" | "objectPosition">;
  variant?: never;
};

type SignBackgroundLayerVariantProps = {
  variant: SignBackgroundVariant;
  background?: never;
};

type SignBackgroundLayerProps = (
  | SignBackgroundLayerImageProps
  | SignBackgroundLayerVariantProps
) & {
  className?: string;
  /** Decorative layers inside sign preview — parent provides aria-label. */
  decorative?: boolean;
};

export function SignBackgroundLayer(props: SignBackgroundLayerProps) {
  const { className, decorative = true } = props;

  if (props.background) {
    const { imageSrc, alt, objectPosition = "50% 50%" } = props.background;
    return (
      <div className={[styles.layer, styles.imageWrap, className].filter(Boolean).join(" ")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={decorative ? "" : alt}
          aria-hidden={decorative ? true : undefined}
          className={styles.image}
          style={{ objectPosition }}
          draggable={false}
          decoding="async"
        />
      </div>
    );
  }

  return (
    <div
      className={[styles.layer, styles[props.variant], className].filter(Boolean).join(" ")}
      aria-hidden="true"
    />
  );
}
