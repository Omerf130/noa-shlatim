import { BUSINESS_DETAILS } from "@/data/businessDetails";
import { siteTermsSections } from "@/data/siteTermsContent";
import {
  TERMS_GENDER_NOTE,
  TERMS_LAST_UPDATED_LABEL,
  TERMS_PAGE_TITLE,
} from "@/lib/legal/terms";
import Link from "next/link";
import styles from "./TermsDocument.module.scss";

const PRIVACY_POLICY_PHRASE = "מדיניות הפרטיות";

function renderTermsParagraph(text: string) {
  const idx = text.indexOf(PRIVACY_POLICY_PHRASE);
  if (idx === -1) {
    return text;
  }
  return (
    <>
      {text.slice(0, idx)}
      <Link href="/privacy" className={styles.contactLink}>
        {PRIVACY_POLICY_PHRASE}
      </Link>
      {text.slice(idx + PRIVACY_POLICY_PHRASE.length)}
    </>
  );
}

export function TermsDocument() {
  return (
    <article className={styles.document}>
      <header className={styles.header}>
        <h1 className={styles.title}>{TERMS_PAGE_TITLE}</h1>
        <p className={styles.updated}>{TERMS_LAST_UPDATED_LABEL}</p>
        <p className={styles.intro}>{TERMS_GENDER_NOTE}</p>
      </header>

      {siteTermsSections.map((section) => (
        <section
          key={section.number}
          className={styles.section}
          aria-labelledby={`terms-section-${section.number}`}
        >
          <h2 id={`terms-section-${section.number}`} className={styles.sectionTitle}>
            {section.number}. {section.title}
          </h2>
          {section.subsections.map((subsection) => (
            <div key={subsection.id} className={styles.subsection}>
              <h3 className={styles.subsectionTitle}>{subsection.id}</h3>
              {subsection.paragraphs.map((paragraph, index) => (
                <p key={index} className={styles.paragraph}>
                  {renderTermsParagraph(paragraph)}
                </p>
              ))}
            </div>
          ))}
        </section>
      ))}

      <section
        className={styles.section}
        aria-labelledby="terms-section-13"
      >
        <h2 id="terms-section-13" className={styles.sectionTitle}>
          13. שירות לקוחות
        </h2>
        <p className={styles.paragraph}>כתובת: {BUSINESS_DETAILS.address}</p>
        <p className={styles.paragraph}>
          טלפון:{" "}
          <a
            href={BUSINESS_DETAILS.telHref}
            className={styles.contactLink}
            dir="ltr"
          >
            {BUSINESS_DETAILS.phone}
          </a>
        </p>
        <p className={styles.paragraph}>
          מייל:{" "}
          <a
            href={BUSINESS_DETAILS.mailtoHref}
            className={styles.contactLink}
            dir="ltr"
          >
            {BUSINESS_DETAILS.email}
          </a>
        </p>
      </section>
    </article>
  );
}
