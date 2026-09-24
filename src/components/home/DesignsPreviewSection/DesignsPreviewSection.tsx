import { designPlaceholderItems } from "@/data/designPlaceholders";
import { SignDesignPlaceholder } from "@/components/placeholders/SignDesignPlaceholder/SignDesignPlaceholder";
import { Container } from "@/components/layout/Container/Container";
import { SectionHeading } from "@/components/ui/SectionHeading/SectionHeading";
import { Button } from "@/components/ui/Button/Button";
import styles from "./DesignsPreviewSection.module.scss";

export function DesignsPreviewSection() {
  return (
    <section
      id="designs"
      className={styles.section}
      aria-labelledby="designs-heading"
    >
      <Container>
        <SectionHeading
          titleId="designs-heading"
          title="בוחרים את הסגנון שמתאים לבית שלכם"
          subtitle="מגוון רקעים ועיצובים — כל שלט נראה אחרת, אבל תמיד אישי."
          align="center"
          className={styles.heading}
        />

        <ul className={styles.grid}>
          {designPlaceholderItems.map((item) => (
            <li key={item.id} className={styles.item}>
              <SignDesignPlaceholder
                variant={item.variant}
                ariaLabel={item.ariaLabel}
                showSignFrame
              />
            </li>
          ))}
        </ul>

        <div className={styles.ctaWrap}>
          <Button href="#designs" variant="secondary">
            לכל העיצובים
          </Button>
        </div>
      </Container>
    </section>
  );
}
