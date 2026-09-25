import { homeMaterials } from "@/data/homeMaterials";
import shared from "@/components/home/shared/homeShared.module.scss";
import { SignFrame } from "@/components/sign/SignFrame/SignFrame";
import { Container } from "@/components/layout/Container/Container";
import { SectionHeading } from "@/components/ui/SectionHeading/SectionHeading";
import styles from "./MaterialsSection.module.scss";

export function MaterialsSection() {
  return (
    <section
      id="materials"
      className={[shared.section, styles.section].join(" ")}
      aria-labelledby="materials-heading"
    >
      <Container>
        <SectionHeading
          titleId="materials-heading"
          title="שני חומרים לבחירה"
          subtitle="מראה ותחושה שונים — שניהם מתאימים לשלט אישי על הדלת."
          align="center"
          className={styles.heading}
        />
        <ul className={styles.grid}>
          {homeMaterials.map((item) => (
            <li key={item.material} className={styles.tile}>
              <div className={styles.previewWrap} aria-hidden="true">
                <SignFrame material={item.material} className={styles.frame}>
                  <div className={styles.faceHint} />
                </SignFrame>
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
