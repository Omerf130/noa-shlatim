import { homeCustomerExamplesSection } from "@/data/homeCustomerExamples";
import { homeHeroAccentLine } from "@/data/homeHero";
import { homeHowItWorksSteps } from "@/data/homeHowItWorks";
import { homePrimaryCta } from "@/data/homeNav";
import { homeEmotionalCta } from "@/data/homeEmotionalCta";
import type { SiteContentData } from "@/lib/siteContent/siteContentSchema";
import { HOW_IT_WORKS_STEP_IDS } from "@/lib/siteContent/siteContentSchema";

/** Canonical approved marketing copy — safe fallback when Mongo is missing or invalid. */
export const DEFAULT_SITE_CONTENT: SiteContentData = {
  seo: {
    homeTitle: "נועה | שלטים לדלת",
    homeDescription:
      "שלטי דלת מותאמים אישית — מהתמונה שלכם לאיור, ומהאיור לשלט על הדלת.",
  },
  global: {
    primaryCtaLabel: homePrimaryCta.label,
    footerTagline: "שלטי דלת מותאמים אישית — מהתמונה שלכם ליצירה על הדלת.",
  },
  home: {
    hero: {
      eyebrow: "שלטים מותאמים אישית",
      titleLine1: "שלט לדלת",
      titleLine2: "בעיצוב אישי",
      accent: homeHeroAccentLine,
      lead:
        "מעלים תמונה, בוחרים סגנון איור, ומעצבים שלט דלת עם רקע, טקסט וחומר — מאויר ואישי, מוכן לכניסה שלכם.",
    },
    howItWorks: {
      heading: "איך זה עובד?",
      subtitle: "ארבעה שלבים פשוטים — מהתמונה ועד שלט על הדלת.",
      steps: HOW_IT_WORKS_STEP_IDS.map((id) => {
        const step = homeHowItWorksSteps.find((s) => s.id === id)!;
        return {
          id,
          title: step.title,
          description: step.description,
        };
      }),
    },
    signExamples: {
      heading: "דוגמאות לשלטים",
      subtitle: "כך נראים שלטים מותאמים — עם איור אישי על הרקע שבחרתם.",
    },
    customerExamples: {
      heading: homeCustomerExamplesSection.title,
      intro: homeCustomerExamplesSection.intro,
      ctaLabel: homeCustomerExamplesSection.cta.label,
    },
    emotionalCta: {
      title: homeEmotionalCta.title,
      bodyText: homeEmotionalCta.text,
    },
  },
};
