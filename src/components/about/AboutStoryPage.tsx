import shared from "@/components/home/shared/homeShared.module.scss";
import { Container } from "@/components/layout/Container/Container";
import { Button } from "@/components/ui/Button/Button";
import {
  aboutBrandMeaning,
  aboutBrandOrigin,
  aboutCta,
  aboutDogStories,
  aboutFinalClose,
  aboutHero,
  aboutLifeTogether,
  aboutMeaningClose,
  aboutNoaArrives,
  aboutNoaFaceQuote,
  aboutOpeningLead,
  aboutTurningPoint,
  ABOUT_PAGE_IMAGE_ALT,
  ABOUT_PAGE_IMAGE_SRC,
} from "@/lib/about/aboutPageContent";
import Image from "next/image";
import styles from "./AboutStoryPage.module.scss";

export function AboutStoryPage() {
  return (
    <article className={styles.page}>
      <header className={styles.hero}>
        <Container size="narrow" className={styles.heroInner}>
          <h1 className={[shared.displayTitle, styles.heroTitle].join(" ")}>
            {aboutHero.title}
          </h1>
          <p className={styles.heroSupporting}>{aboutHero.supportingLine}</p>
        </Container>
      </header>

      <section className={styles.section} aria-labelledby="about-opening">
        <Container size="narrow">
          <div className={styles.openingLead} id="about-opening">
            {aboutOpeningLead.map((line) => (
              <p key={line} className={styles.openingLine}>
                {line}
              </p>
            ))}
          </div>
        </Container>
      </section>

      <section className={[styles.section, styles.sectionSoft].join(" ")} aria-label="נועה נכנסת לסיפור">
        <Container size="wide">
          <div className={styles.noahIntroGrid}>
            <div className={styles.noahIntroCopy}>
              {aboutNoaArrives.map((paragraph) => (
                <p key={paragraph} className={styles.bodyText}>
                  {paragraph}
                </p>
              ))}
            </div>
            <figure className={styles.mainFigure}>
              <div className={styles.mainImageFrame}>
                <Image
                  src={ABOUT_PAGE_IMAGE_SRC}
                  alt={ABOUT_PAGE_IMAGE_ALT}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, min(480px, 42vw)"
                  className={styles.mainImage}
                />
              </div>
            </figure>
          </div>
        </Container>
      </section>

      <section className={styles.section} aria-label="חיים ביחד">
        <Container size="narrow" className={styles.lifeFlow}>
          {aboutLifeTogether.map((paragraph, index) => (
            <p
              key={paragraph}
              className={[
                styles.bodyText,
                index >= 3 ? styles.bodyTextShort : "",
                index === 3 ? styles.bodyEmphasisLine : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {paragraph}
            </p>
          ))}
          <p className={styles.bodyText}>
            {aboutNoaFaceQuote.lead}
            <br />
            <span className={styles.inlineQuote}>{aboutNoaFaceQuote.quote}</span>
          </p>
        </Container>
      </section>

      <section className={[styles.section, styles.sectionAccent].join(" ")} aria-label="נקודת מפנה">
        <Container size="narrow">
          <p className={styles.bodyText}>{aboutTurningPoint.intro}</p>
          <p className={styles.pullQuote}>{aboutTurningPoint.emphasis}</p>
          {aboutTurningPoint.follow.map((paragraph) => (
            <p key={paragraph} className={styles.bodyText}>
              {paragraph}
            </p>
          ))}
          <blockquote className={styles.doorMoment}>
            <p>{aboutTurningPoint.doorQuestion[0]}</p>
            <p>{aboutTurningPoint.doorQuestion[1]}</p>
          </blockquote>
        </Container>
      </section>

      <section className={styles.section} aria-label="לידת המותג">
        <Container size="narrow">
          <p className={styles.brandOrigin}>{aboutBrandOrigin}</p>
          {aboutBrandMeaning.map((paragraph) => (
            <p key={paragraph} className={styles.bodyText}>
              {paragraph}
            </p>
          ))}
        </Container>
      </section>

      <section className={[styles.section, styles.sectionSoft].join(" ")} aria-label="המשמעות הרחבה">
        <Container size="narrow">
          <ul className={styles.dogStoryList}>
            {aboutDogStories.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {aboutMeaningClose.map((paragraph, index) => (
            <p
              key={paragraph}
              className={[
                styles.bodyText,
                index === 1 ? styles.bodyTextEmphasis : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {paragraph}
            </p>
          ))}
        </Container>
      </section>

      <section className={[styles.section, styles.sectionClosing].join(" ")} aria-label="סיום">
        <Container size="narrow">
          <div className={styles.finalClose}>
            <p>{aboutFinalClose[0]}</p>
            <p className={styles.finalCloseHighlight}>{aboutFinalClose[1]}</p>
          </div>
        </Container>
      </section>

      <section className={styles.ctaSection} aria-label="יצירת שלט">
        <Container size="narrow" className={styles.ctaInner}>
          <p className={styles.ctaPrompt}>{aboutCta.prompt}</p>
          <Button href={aboutCta.href} variant="brand" className={styles.ctaButton}>
            {aboutCta.buttonLabel}
          </Button>
        </Container>
      </section>
    </article>
  );
}
