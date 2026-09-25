import {
  homeCustomerExamples,
  homeCustomerExamplesSection,
} from "@/data/homeCustomerExamples";
import shared from "@/components/home/shared/homeShared.module.scss";
import { Container } from "@/components/layout/Container/Container";
import { Button } from "@/components/ui/Button/Button";
import { SectionHeading } from "@/components/ui/SectionHeading/SectionHeading";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import styles from "./CustomerExamplesSection.module.scss";

export function CustomerExamplesSection() {
  const { title, intro, cta } = homeCustomerExamplesSection;

  return (
    <section
      id="customer-examples"
      className={[shared.section, styles.section].join(" ")}
      aria-labelledby="customer-examples-heading"
    >
      <Container size="wide" className={styles.container}>
        <SectionHeading
          titleId="customer-examples-heading"
          title={title}
          align="center"
          className={styles.heading}
        />
        <p className={styles.intro}>{intro}</p>

        <ul className={styles.gallery}>
          {homeCustomerExamples.map((item) => (
            <li key={item.id} className={styles.item}>
              <figure className={styles.figure}>
                <Image
                  src={item.imageSrc}
                  alt={item.imageAlt}
                  width={1200}
                  height={900}
                  sizes="(max-width: 599px) 100vw, (max-width: 899px) 50vw, 480px"
                  className={styles.image}
                />
              </figure>
            </li>
          ))}
        </ul>

        <div className={styles.ctaRow}>
          <Button href={cta.href} variant="brand">
            {cta.label}
            <ArrowLeft size={18} aria-hidden />
          </Button>
        </div>
      </Container>
    </section>
  );
}
