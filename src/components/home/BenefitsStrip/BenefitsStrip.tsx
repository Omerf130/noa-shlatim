import { homeBenefits } from "@/data/homeBenefits";
import { Container } from "@/components/layout/Container/Container";
import styles from "./BenefitsStrip.module.scss";

export function BenefitsStrip() {
  return (
    <section className={styles.section} aria-label="יתרונות המוצר">
      <Container>
        <ul className={styles.list}>
          {homeBenefits.map(({ label, Icon }) => (
            <li key={label} className={styles.item}>
              <span className={styles.iconWrap} aria-hidden="true">
                <Icon size={22} strokeWidth={1.75} />
              </span>
              <span className={styles.label}>{label}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
