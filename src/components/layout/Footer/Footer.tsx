import { BrandLogo } from "@/components/brand/BrandLogo/BrandLogo";
import { Container } from "@/components/layout/Container/Container";
import Link from "next/link";
import styles from "./Footer.module.scss";

const footerLinks = [
  { href: "#", label: "יצירת קשר" },
  { href: "#", label: "תנאים" },
  { href: "#", label: "פרטיות" },
  { href: "#", label: "נגישות" },
] as const;

export function Footer() {
  return (
    <footer className={styles.footer}>
      <Container>
        <div className={styles.grid}>
          <div className={styles.brandBlock}>
            <BrandLogo asLink={false} />
            <p className={styles.tagline}>
              שלטי דלת מותאמים אישית — מהמשפחה שלכם ליצירה על הדלת.
            </p>
          </div>

          <nav className={styles.linksNav} aria-label="קישורי תחתית">
            <ul className={styles.linksList}>
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={styles.footerLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className={styles.copy}>
          © {new Date().getFullYear()} נועה · שלטים לדלת
        </p>
      </Container>
    </footer>
  );
}
