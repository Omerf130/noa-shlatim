import { Container } from "@/components/layout/Container/Container";
import { SectionHeading } from "@/components/ui/SectionHeading/SectionHeading";
import { ImagePlus, Palette, Sparkles, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import styles from "./HowItWorksSection.module.scss";

const steps: { number: number; title: string; description: string; Icon: LucideIcon }[] = [
  {
    number: 1,
    title: "מעלים תמונה",
    description: "תמונת משפחה או איור קיים — נתחיל משם.",
    Icon: ImagePlus,
  },
  {
    number: 2,
    title: "בוחרים סגנון ועיצוב",
    description: "רקע, צבעים ומראה שמתאימים לבית.",
    Icon: Palette,
  },
  {
    number: 3,
    title: "מוסיפים את הטאץ' שלכם",
    description: "טקסט, מיקום וגודל — בדיוק כמו שתרצו.",
    Icon: Sparkles,
  },
  {
    number: 4,
    title: "אנחנו מכינים את השלט",
    description: "שלט איכותי שמגיע אליכם מוכן לתליה.",
    Icon: Package,
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className={styles.section}
      aria-labelledby="how-it-works-heading"
    >
      <Container>
        <SectionHeading
          titleId="how-it-works-heading"
          title="איך זה עובד?"
          subtitle="ארבעה שלבים פשוטים — מהרעיון ועד שלט על הדלת."
        />
        <ol className={styles.steps}>
          {steps.map(({ number, title, description, Icon }) => (
            <li key={number} className={styles.step}>
              <div className={styles.stepHeader}>
                <span className={styles.number} aria-hidden="true">
                  {number}
                </span>
                <span className={styles.iconWrap} aria-hidden="true">
                  <Icon size={22} strokeWidth={1.75} />
                </span>
              </div>
              <h3 className={styles.stepTitle}>{title}</h3>
              <p className={styles.stepText}>{description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
