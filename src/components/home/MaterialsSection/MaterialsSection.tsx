import { Container } from "@/components/layout/Container/Container";
import { SectionHeading } from "@/components/ui/SectionHeading/SectionHeading";
import styles from "./MaterialsSection.module.scss";

export function MaterialsSection() {
  return (
    <section className={styles.section} aria-labelledby="materials-heading">
      <Container size="narrow">
        <SectionHeading
          titleId="materials-heading"
          title="בחירת חומר"
          subtitle="שני אפשרויות לתליה — לפי הסגנון של הדלת והבית."
          align="center"
          className={styles.heading}
        />

        <ul className={styles.list}>
          <li className={styles.tile}>
            <div className={[styles.preview, styles.wood].join(" ")} aria-hidden="true" />
            <h3 className={styles.name}>עץ</h3>
            <p className={styles.desc}>מראה חם וטבעי, מתאים במיוחד לכניסה ביתית.</p>
          </li>
          <li className={styles.tile}>
            <div className={[styles.preview, styles.magnet].join(" ")} aria-hidden="true" />
            <h3 className={styles.name}>מגנט</h3>
            <p className={styles.desc}>קל להחלפה ולמיקום — מתאים לדלתות מתכת.</p>
          </li>
        </ul>
      </Container>
    </section>
  );
}
