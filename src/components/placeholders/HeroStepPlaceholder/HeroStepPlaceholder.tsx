import styles from "./HeroStepPlaceholder.module.scss";

export type HeroStepKind = "photo" | "illustration" | "sign";

type HeroStepPlaceholderProps = {
  kind: HeroStepKind;
  label: string;
};

export function HeroStepPlaceholder({ kind, label }: HeroStepPlaceholderProps) {
  return (
    <figure className={styles.figure}>
      <div className={[styles.card, styles[kind]].join(" ")} aria-hidden="true">
        {kind === "photo" && (
          <>
            <div className={styles.photoFrame} />
            <div className={styles.photoSilhouette} />
          </>
        )}
        {kind === "illustration" && (
          <>
            <div className={styles.blobA} />
            <div className={styles.blobB} />
            <div className={styles.faceHint} />
          </>
        )}
        {kind === "sign" && (
          <>
            <div className={styles.plaque}>
              <div className={styles.plaqueArt} />
              <div className={styles.plaqueText} />
            </div>
            <div className={styles.doorHint} />
          </>
        )}
      </div>
      <figcaption className={styles.caption}>{label}</figcaption>
    </figure>
  );
}
