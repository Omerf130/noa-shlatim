import { publicAssetPath } from "@/lib/home/publicAssetPath";

export type HomeCustomerExampleItem = {
  id: string;
  imageSrc: string;
  imageAlt: string;
};

export const homeCustomerExamplesSection = {
  title: "דוגמאות של לקוחות",
  intro: "כל שלט הוא קצת אחר. הנה כמה רעיונות שאפשר לקחת מהם השראה.",
  cta: {
    href: "/create",
    label: "גם אני רוצה שלט כזה",
  },
} as const;

/** Showcase/demo compositions — not verified customer testimonials. */
export const homeCustomerExamples: HomeCustomerExampleItem[] = [
  {
    id: "customer-example-1",
    imageSrc: publicAssetPath("examples/1.png"),
    imageAlt: "דוגמה לשלט אישי ליחיד",
  },
  {
    id: "customer-example-2",
    imageSrc: publicAssetPath("examples/2.png"),
    imageAlt: "דוגמה לשלט לזוג עם כלב",
  },
  {
    id: "customer-example-5",
    imageSrc: publicAssetPath("examples/5.png"),
    imageAlt: "דוגמה לשלט לזוג עם ילד",
  },
  {
    id: "customer-example-6",
    imageSrc: publicAssetPath("examples/6.png"),
    imageAlt: "דוגמה לשלט זוגי",
  },
];
