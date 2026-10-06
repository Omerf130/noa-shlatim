import { z } from "zod";

const shortText = z.string().trim().min(1).max(120);
const mediumText = z.string().trim().min(1).max(280);
const longText = z.string().trim().min(1).max(600);
const seoTitle = z.string().trim().min(1).max(80);
const seoDescription = z.string().trim().min(1).max(320);

export const HOW_IT_WORKS_STEP_IDS = ["upload", "illustrate", "design", "order"] as const;
export type HowItWorksStepId = (typeof HOW_IT_WORKS_STEP_IDS)[number];

const howItWorksStepSchema = z.object({
  id: z.enum(HOW_IT_WORKS_STEP_IDS),
  title: shortText,
  description: mediumText,
});

export const siteContentSchema = z.object({
  seo: z.object({
    homeTitle: seoTitle,
    homeDescription: seoDescription,
  }),
  global: z.object({
    primaryCtaLabel: shortText,
    footerTagline: mediumText,
  }),
  home: z.object({
    hero: z.object({
      eyebrow: shortText,
      titleLine1: shortText,
      titleLine2: shortText,
      accent: shortText,
      lead: longText,
    }),
    howItWorks: z.object({
      heading: shortText,
      subtitle: mediumText,
      steps: z.array(howItWorksStepSchema).length(4),
    }),
    signExamples: z.object({
      heading: shortText,
      subtitle: mediumText,
    }),
    customerExamples: z.object({
      heading: shortText,
      intro: mediumText,
      ctaLabel: shortText,
    }),
    emotionalCta: z.object({
      title: shortText,
      bodyText: mediumText,
    }),
  }),
});

export type SiteContentData = z.infer<typeof siteContentSchema>;

export type SiteContentSectionKey =
  | "hero"
  | "howItWorks"
  | "signExamples"
  | "customerExamples"
  | "emotionalCta"
  | "footer"
  | "seo";
