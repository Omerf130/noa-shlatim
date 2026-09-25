import type { HomeSignExampleItem } from "@/data/homeSignExamples";
import { SignPreview } from "@/components/builder/SignPreview/SignPreview";
import styles from "./SignExamplesSection.module.scss";

type SignExampleCardProps = {
  item: HomeSignExampleItem;
};

export function SignExampleCard({ item }: SignExampleCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.visual}>
        <SignPreview
          design={item.design}
          size="showcase"
          className={styles.preview}
          ariaLabel={item.previewAriaLabel}
        />
      </div>
      <h3 className={styles.title}>{item.title}</h3>
      <p className={styles.caption}>{item.caption}</p>
    </article>
  );
}
