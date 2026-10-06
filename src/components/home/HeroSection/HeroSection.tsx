import {
  homeHeroScene,
  homeHeroValueItems,
  type HomeHeroValueItemId,
} from "@/data/homeHero";
import { homePrimaryCta } from "@/data/homeNav";
import type { SiteContentData } from "@/lib/siteContent/siteContentSchema";
import { Button } from "@/components/ui/Button/Button";
import shared from "@/components/home/shared/homeShared.module.scss";
import { ArrowLeft, ListChecks, Magnet, Wand2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import styles from "./HeroSection.module.scss";

const valueIcons: Record<HomeHeroValueItemId, LucideIcon> = {
  personal: Wand2,
  process: ListChecks,
  material: Magnet,
};

type HeroSectionProps = {
  hero: SiteContentData["home"]["hero"];
  primaryCtaLabel: string;
};

export function HeroSection({ hero, primaryCtaLabel }: HeroSectionProps) {
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.scene}>
        <div className={styles.visualRegion}>
          <Image
            src={homeHeroScene.imageSrc}
            alt={homeHeroScene.imageAlt}
            fill
            priority
            sizes="(max-width: 899px) 100vw, 55vw"
            className={styles.sceneImage}
            style={{ objectPosition: homeHeroScene.objectPosition }}
          />
          <div className={styles.seamFadeToContent} aria-hidden="true" />
          <div className={styles.seamFadeMobile} aria-hidden="true" />
        </div>

        <div className={styles.contentAtmosphere} aria-hidden="true" />

        <div className={styles.contentShell}>
          <div className={styles.copyHead}>
            <p className={[shared.eyebrow, styles.eyebrow].join(" ")}>{hero.eyebrow}</p>
            <h1 id="hero-heading" className={[shared.displayTitle, styles.title].join(" ")}>
              <span className={styles.titleLine}>{hero.titleLine1}</span>
              <span className={styles.titleLine}>{hero.titleLine2}</span>
            </h1>
          </div>

          <div className={styles.copyTail}>
            <p className={styles.accent}>{hero.accent}</p>
            <div className={styles.copyRest}>
              <p className={styles.lead}>{hero.lead}</p>
              <div className={styles.ctaRow}>
                <Button href={homePrimaryCta.href} variant="brand" className={styles.cta}>
                  {primaryCtaLabel}
                  <ArrowLeft size={18} aria-hidden />
                </Button>
              </div>
              <ul className={styles.values} aria-label="יתרונות המוצר">
                {homeHeroValueItems.map((item) => {
                  const Icon = valueIcons[item.id];
                  return (
                    <li key={item.id}>
                      <Icon size={16} strokeWidth={1.75} aria-hidden />
                      <span>{item.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
