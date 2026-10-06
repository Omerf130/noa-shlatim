import { homeHowItWorksSteps } from "@/data/homeHowItWorks";
import type { SiteContentData } from "@/lib/siteContent/siteContentSchema";
import { BotanicalDivider } from "@/components/home/shared/BotanicalDivider";
import shared from "@/components/home/shared/homeShared.module.scss";
import { Container } from "@/components/layout/Container/Container";
import { SectionHeading } from "@/components/ui/SectionHeading/SectionHeading";
import { ArrowLeft } from "lucide-react";
import styles from "./HowItWorksSection.module.scss";

type HowItWorksSectionProps = {
  content: SiteContentData["home"]["howItWorks"];
};

export function HowItWorksSection({ content }: HowItWorksSectionProps) {
  const stepsById = new Map(content.steps.map((s) => [s.id, s]));

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
          title={content.heading}
          subtitle={content.subtitle}
          align="center"
          className={styles.heading}
        />
        <ol className={styles.flow}>
          {homeHowItWorksSteps.map((step, index) => {
            const copy = stepsById.get(step.id as (typeof content.steps)[number]["id"]);
            return (
              <li key={step.id} className={styles.stepCell}>
                <div className={styles.step}>
                  <span className={styles.iconCircle} aria-hidden="true">
                    <step.Icon size={22} strokeWidth={1.75} />
                  </span>
                  <h3 className={styles.stepTitle}>{copy?.title ?? step.title}</h3>
                  <p className={styles.stepText}>{copy?.description ?? step.description}</p>
                </div>
                {index < homeHowItWorksSteps.length - 1 && (
                  <span className={styles.arrow} aria-hidden="true">
                    <ArrowLeft size={20} strokeWidth={1.5} />
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}
