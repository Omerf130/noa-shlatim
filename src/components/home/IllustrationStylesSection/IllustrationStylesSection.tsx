import { homeIllustrationShowcaseItems } from "@/data/homeIllustrationShowcase";
import { VisualPlaceholder } from "@/components/home/shared/VisualPlaceholder";
import shared from "@/components/home/shared/homeShared.module.scss";
import { Container } from "@/components/layout/Container/Container";
import { SectionHeading } from "@/components/ui/SectionHeading/SectionHeading";
import Image from "next/image";
import styles from "./IllustrationStylesSection.module.scss";

export function IllustrationStylesSection() {
  return (
    <section
      id="illustration-styles"
      className={[shared.section, styles.section].join(" ")}
      aria-labelledby="illustration-styles-heading"
    >
      <Container>
        <SectionHeading
          titleId="illustration-styles-heading"
          title="סגנונות איור לבחירה"
          subtitle="אותה משפחה — שלושה כיוונים עיצוביים. בוחרים מה שמתאים לכם."
          align="center"
          className={styles.heading}
        />
        <ul className={styles.grid}>
          {homeIllustrationShowcaseItems.map((item) => (
            <li key={item.styleId} className={styles.card}>
              <div className={styles.visual}>
                {item.imageSrc ? (
                  <div className={styles.imageWrap}>
                    <Image
                      src={item.imageSrc}
                      alt={item.imageAlt}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className={styles.image}
                      style={{ objectPosition: item.imageObjectPosition }}
                    />
                  </div>
                ) : (
                  <VisualPlaceholder
                    title={`סגנון ${item.name}`}
                    note="אותם נושאים בשלושה סגנונות — תמונות דוגמה בקרוב"
                    aspectRatio="4 / 5"
                  />
                )}
              </div>
              <h3 className={styles.name}>{item.name}</h3>
              <p className={styles.desc}>{item.description}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
