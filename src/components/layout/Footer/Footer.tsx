import { BrandLogo } from "@/components/brand/BrandLogo/BrandLogo";
import { WEBLIO_CREDIT } from "@/data/siteCredits";
import { homeNavLinks, homePrimaryCta } from "@/data/homeNav";
import { Container } from "@/components/layout/Container/Container";
import { Button } from "@/components/ui/Button/Button";
import Link from "next/link";
import styles from "./Footer.module.scss";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.grid}>
          <div className={styles.brandBlock}>
            <BrandLogo asLink={false} className={styles.logoOnDark} />
            <p className={styles.tagline}>
              שלטי דלת מותאמים אישית — מהתמונה שלכם ליצירה על הדלת.
            </p>
            <Button href={homePrimaryCta.href} variant="secondary" className={styles.footerCta}>
              {homePrimaryCta.label}
            </Button>
          </div>

          <nav className={styles.linksNav} aria-label="קישורי תחתית">
            <ul className={styles.linksList}>
              {homeNavLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className={styles.footerLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className={styles.bottomBar}>
          <p className={styles.copy}>
            © {new Date().getFullYear()} נועה · שלטים לדלת
          </p>
          <p className={styles.credit}>
            {WEBLIO_CREDIT.linePrefix}{" "}
            <a
              href={WEBLIO_CREDIT.href}
              className={styles.creditLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {WEBLIO_CREDIT.label}
            </a>
          </p>
        </div>
      </Container>
    </footer>
  );
}
