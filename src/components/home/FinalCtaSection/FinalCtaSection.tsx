import { Button } from "@/components/ui/Button/Button";
import { Container } from "@/components/layout/Container/Container";
import styles from "./FinalCtaSection.module.scss";

export function FinalCtaSection() {
  return (
    <section className={styles.section} aria-labelledby="final-cta-heading">
      <Container size="narrow">
        <div className={styles.panel}>
          <h2 id="final-cta-heading" className={styles.title}>
            הדלת שלכם. המשפחה שלכם. השלט שלכם.
          </h2>
          <p className={styles.text}>
            מוכנים ליצור שלט שמרגיש בבית מהרגע הראשון?
          </p>
          <Button href="/create" className={styles.button}>
            בואו ניצור את השלט שלכם
          </Button>
        </div>
      </Container>
    </section>
  );
}
