import { BUSINESS_DETAILS } from "@/data/businessDetails";
import { sitePrivacySections } from "@/data/sitePrivacyContent";
import {
  PRIVACY_LAST_UPDATED_LABEL,
  PRIVACY_PAGE_TITLE,
} from "@/lib/legal/privacy";
import Link from "next/link";
import styles from "../TermsDocument/TermsDocument.module.scss";

function privacyBusinessName(): string {
  return BUSINESS_DETAILS.businessName.replace(/\u2013|\u2014/g, "-");
}

export function PrivacyDocument() {
  return (
    <article className={styles.document}>
      <header className={styles.header}>
        <h1 className={styles.title}>{PRIVACY_PAGE_TITLE}</h1>
        <p className={styles.updated}>{PRIVACY_LAST_UPDATED_LABEL}</p>
      </header>

      {sitePrivacySections.map((section, sectionIndex) => (
        <section
          key={`${section.number}-${sectionIndex}`}
          className={styles.section}
          aria-labelledby={`privacy-section-${section.number}-${sectionIndex}`}
        >
          <h2
            id={`privacy-section-${section.number}-${sectionIndex}`}
            className={styles.sectionTitle}
          >
            {section.number}. {section.title}
          </h2>
          {section.paragraphs[0] && (
            <p className={styles.paragraph}>{section.paragraphs[0]}</p>
          )}
          {section.bullets && section.bullets.length > 0 && (
            <ul className={styles.bulletList}>
              {section.bullets.map((item) => (
                <li key={item} className={styles.bulletItem}>
                  {item}
                </li>
              ))}
            </ul>
          )}
          {section.paragraphs.slice(1).map((paragraph, index) => (
            <p key={index} className={styles.paragraph}>
              {paragraph}
            </p>
          ))}
          {section.termsCrossLink && (
            <p className={styles.paragraph}>
              השימוש באתר כפוף גם ל{" "}
              <Link href="/terms" className={styles.contactLink}>
                תקנון האתר
              </Link>
              .
            </p>
          )}
        </section>
      ))}

      <section className={styles.section} aria-labelledby="privacy-section-13">
        <h2 id="privacy-section-13" className={styles.sectionTitle}>
          13. יצירת קשר
        </h2>
        <p className={styles.paragraph}>
          לשאלות או בקשות בנושא פרטיות ניתן לפנות אל:
        </p>
        <p className={styles.paragraph}>{privacyBusinessName()}</p>
        <p className={styles.paragraph}>{BUSINESS_DETAILS.address}</p>
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
          אימייל:{" "}
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
