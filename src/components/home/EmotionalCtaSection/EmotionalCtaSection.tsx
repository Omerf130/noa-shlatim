import { homeEmotionalCta } from "@/data/homeEmotionalCta";
import shared from "@/components/home/shared/homeShared.module.scss";
import { Container } from "@/components/layout/Container/Container";
import { Button } from "@/components/ui/Button/Button";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import styles from "./EmotionalCtaSection.module.scss";

export function EmotionalCtaSection() {
  return (
    <section
      id="start-design"
      className={[shared.section, styles.section].join(" ")}
      aria-labelledby="emotional-cta-heading"
    >
      <Container size="wide">
        <div className={styles.panel}>
          <div className={styles.media}>
            <Image
              src={homeEmotionalCta.imageSrc}
              alt={homeEmotionalCta.imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={styles.image}
              style={{ objectPosition: homeEmotionalCta.objectPosition }}
            />
          </div>
          <div className={styles.copy}>
            <h2 id="emotional-cta-heading" className={[shared.displayTitle, styles.title].join(" ")}>
              {homeEmotionalCta.title}
            </h2>
            <p className={styles.text}>{homeEmotionalCta.text}</p>
            <Button href={homeEmotionalCta.cta.href} variant="brand">
              {homeEmotionalCta.cta.label}
              <ArrowLeft size={18} aria-hidden />
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
