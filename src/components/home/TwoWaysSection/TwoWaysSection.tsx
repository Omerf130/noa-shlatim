import { Container } from "@/components/layout/Container/Container";
import { SectionHeading } from "@/components/ui/SectionHeading/SectionHeading";
import { Camera, PenLine } from "lucide-react";
import styles from "./TwoWaysSection.module.scss";

export function TwoWaysSection() {
  return (
    <section className={styles.section} aria-labelledby="two-ways-heading">
      <Container>
        <SectionHeading
          titleId="two-ways-heading"
          title="שני דרכים להתחיל"
          subtitle="בין אם יש לכם תמונה מהטלפון או איור מוכן — נמשיך מאותה נקודה."
        />
        <div className={styles.cards}>
          <article className={styles.card}>
            <div className={styles.cardIcon} aria-hidden="true">
              <Camera size={26} strokeWidth={1.75} />
            </div>
            <h3 className={styles.cardTitle}>יש לי תמונה רגילה</h3>
            <p className={styles.cardText}>
              מעלים תמונת משפחה, והמערכת תהפוך אותה לאיור מותאם לשלט שלכם.
            </p>
            <div className={styles.uploadZone} aria-hidden="true">
              <span>אזור העלאה — בקרוב</span>
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardIcon} aria-hidden="true">
              <PenLine size={26} strokeWidth={1.75} />
            </div>
            <h3 className={styles.cardTitle}>כבר יש לי איור</h3>
            <p className={styles.cardText}>
              מעלים קובץ מאויר קיים וממשיכים ישר לעיצוב השלט והרקע.
            </p>
            <div className={[styles.uploadZone, styles.uploadZoneAlt].join(" ")} aria-hidden="true">
              <span>אזור העלאה — בקרוב</span>
            </div>
          </article>
        </div>
      </Container>
    </section>
  );
}
