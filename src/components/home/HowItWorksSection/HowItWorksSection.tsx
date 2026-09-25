import { homeHowItWorksSteps } from "@/data/homeHowItWorks";
import { BotanicalDivider } from "@/components/home/shared/BotanicalDivider";
import shared from "@/components/home/shared/homeShared.module.scss";
import { Container } from "@/components/layout/Container/Container";
import { SectionHeading } from "@/components/ui/SectionHeading/SectionHeading";
import { ArrowLeft } from "lucide-react";
import styles from "./HowItWorksSection.module.scss";

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className={[shared.section, styles.section].join(" ")}
      aria-labelledby="how-it-works-heading"
    >
      <Container>
        <BotanicalDivider />
        <SectionHeading
          titleId="how-it-works-heading"
          title="איך זה עובד?"
          subtitle="ארבעה שלבים פשוטים — מהתמונה ועד שלט על הדלת."
          align="center"
          className={styles.heading}
        />
        <ol className={styles.flow}>
          {homeHowItWorksSteps.map((step, index) => (
            <li key={step.id} className={styles.stepCell}>
              <div className={styles.step}>
                <span className={styles.iconCircle} aria-hidden="true">
                  <step.Icon size={22} strokeWidth={1.75} />
                </span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepText}>{step.description}</p>
              </div>
              {index < homeHowItWorksSteps.length - 1 && (
                <span className={styles.arrow} aria-hidden="true">
                  <ArrowLeft size={20} strokeWidth={1.5} />
                </span>
              )}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
