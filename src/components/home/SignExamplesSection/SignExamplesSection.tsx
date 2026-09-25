import { homeSignExamples } from "@/data/homeSignExamples";
import { SignExampleCard } from "@/components/home/SignExamplesSection/SignExampleCard";
import shared from "@/components/home/shared/homeShared.module.scss";
import { Container } from "@/components/layout/Container/Container";
import { SectionHeading } from "@/components/ui/SectionHeading/SectionHeading";
import styles from "./SignExamplesSection.module.scss";

export function SignExamplesSection() {
  return (
    <section
      id="examples"
      className={[shared.section, styles.section].join(" ")}
      aria-labelledby="examples-heading"
    >
      <Container>
        <SectionHeading
          titleId="examples-heading"
          title="דוגמאות לשלטים"
          subtitle="כך נראים שלטים מותאמים — עם איור אישי על הרקע שבחרתם."
          align="center"
          className={styles.heading}
        />
        <div className={styles.track} role="list">
          {homeSignExamples.map((item) => (
            <div key={item.id} className={styles.trackItem} role="listitem">
              <SignExampleCard item={item} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
