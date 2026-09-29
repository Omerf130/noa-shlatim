import type { HomeSignExampleItem } from "@/data/homeSignExamples";
import Image from "next/image";
import styles from "./SignExamplesSection.module.scss";

type SignExampleCardProps = {
  item: HomeSignExampleItem;
};

const FINISHED_SIGN_WIDTH = 1672;
const FINISHED_SIGN_HEIGHT = 941;

export function SignExampleCard({ item }: SignExampleCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.visual}>
        <figure className={styles.figure}>
          <Image
            src={item.finishedSignImageSrc}
            alt={item.previewAriaLabel}
            width={FINISHED_SIGN_WIDTH}
            height={FINISHED_SIGN_HEIGHT}
            sizes="(max-width: 899px) min(85vw, 320px), 33vw"
            className={styles.exampleImage}
          />
        </figure>
      </div>
      <h3 className={styles.title}>{item.title}</h3>
      <p className={styles.caption}>{item.caption}</p>
    </article>
  );
}
