import { homeSignExamples } from "@/data/homeSignExamples";
import type { SiteContentData } from "@/lib/siteContent/siteContentSchema";
import { SignExampleCard } from "@/components/home/SignExamplesSection/SignExampleCard";
import shared from "@/components/home/shared/homeShared.module.scss";
import { Container } from "@/components/layout/Container/Container";
import { SectionHeading } from "@/components/ui/SectionHeading/SectionHeading";
import styles from "./SignExamplesSection.module.scss";

type SignExamplesSectionProps = {
  content: SiteContentData["home"]["signExamples"];
};

export function SignExamplesSection({ content }: SignExamplesSectionProps) {
  return (
    <section
      id="examples"
      className={[shared.section, styles.section].join(" ")}
      aria-labelledby="examples-heading"
    >
      <Container>
        <SectionHeading
          titleId="examples-heading"
          title={content.heading}
          subtitle={content.subtitle}
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
