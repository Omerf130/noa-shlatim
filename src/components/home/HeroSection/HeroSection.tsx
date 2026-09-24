import { HeroStepPlaceholder } from "@/components/placeholders/HeroStepPlaceholder/HeroStepPlaceholder";
import { Button } from "@/components/ui/Button/Button";
import { Container } from "@/components/layout/Container/Container";
import { ArrowLeft } from "lucide-react";
import styles from "./HeroSection.module.scss";

export function HeroSection() {
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <Container className={styles.container}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>שלטים מותאמים אישית</p>
          <h1 id="hero-heading" className={styles.title}>
            המשפחה שלכם, עכשיו על הדלת
          </h1>
          <p className={styles.lead}>
            מעלים תמונה, בוחרים סגנון ועיצוב, ומוסיפים את הטקסט שלכם — ויוצרים
            שלט דלת מאויר ואישי שמרגיש בדיוק שלכם.
          </p>
          <div className={styles.ctas}>
            <Button href="/create">מתחילים לעצב</Button>
            <Button href="#how-it-works" variant="secondary">
              איך זה עובד?
            </Button>
          </div>
        </div>

        <div className={styles.visual} aria-label="תהליך: מתמונה לשלט">
          <HeroStepPlaceholder kind="photo" label="תמונה" />
          <span className={styles.arrow} aria-hidden="true">
            <ArrowLeft size={28} strokeWidth={1.75} />
          </span>
          <HeroStepPlaceholder kind="illustration" label="איור" />
          <span className={styles.arrow} aria-hidden="true">
            <ArrowLeft size={28} strokeWidth={1.75} />
          </span>
          <HeroStepPlaceholder kind="sign" label="שלט לדלת" />
        </div>
      </Container>
      <div className={styles.blobDecor} aria-hidden="true" />
    </section>
  );
}
