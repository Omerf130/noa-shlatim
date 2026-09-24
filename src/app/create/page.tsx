import { BrandLogo } from "@/components/brand/BrandLogo/BrandLogo";
import { Button } from "@/components/ui/Button/Button";
import { Container } from "@/components/layout/Container/Container";
import Link from "next/link";
import styles from "./page.module.scss";

export const metadata = {
  title: "מתחילים לעצב | נועה",
};

export default function CreatePlaceholderPage() {
  return (
    <div className={styles.page}>
      <Container size="narrow" className={styles.inner}>
        <BrandLogo />
        <h1 className={styles.title}>עורך השלט — בקרוב</h1>
        <p className={styles.text}>
          כאן תוכלו להעלות תמונה, לבחור עיצוב ולהתאים את השלט שלכם. בינתיים אפשר
          לחזור לדף הבית ולהכיר את המוצר.
        </p>
        <Button href="/">חזרה לדף הבית</Button>
        <p className={styles.back}>
          <Link href="/">דף הבית</Link>
        </p>
      </Container>
    </div>
  );
}
