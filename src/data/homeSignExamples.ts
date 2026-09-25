import { homeIllustrationShowcaseItems } from "@/data/homeIllustrationShowcase";
import {
  multicolorTextColor,
  solidTextColor,
} from "@/data/signTextColors";
import type { IllustrationAsset, SignDesignState } from "@/types/signDesign";

export type HomeSignExampleItem = {
  id: string;
  title: string;
  caption: string;
  design: SignDesignState;
  previewAriaLabel: string;
};

function illustrationForStyle(styleId: string): IllustrationAsset {
  const showcase = homeIllustrationShowcaseItems.find(
    (item) => item.styleId === styleId,
  );
  const objectUrl = showcase?.imageSrc;
  if (!objectUrl) {
    throw new Error(`Missing homepage example illustration for ${styleId}`);
  }
  return {
    objectUrl,
    source: "ai",
    styleId,
  };
}

/** Static homepage demos — not builder catalog options. */
export const homeSignExamples: HomeSignExampleItem[] = [
  {
    id: "example-family",
    title: "שלט משפחתי",
    caption: "שם המשפחה בראש השלט, האיור במרכז — עץ חם לכניסה ביתית.",
    previewAriaLabel: "דוגמת שלט משפחתי — משפחת לוי, סגנון קלאסי, רקע חצר",
    design: {
      creationMode: "photo",
      originalImage: null,
      photoIllustrationStyleId: "style-classic",
      illustration: illustrationForStyle("style-classic"),
      backgroundId: "bg-garden-courtyard",
      text: {
        value: "משפחת לוי",
        color: solidTextColor("#2d4a3e"),
        size: 28,
        position: "top",
        fontStyle: "soft",
      },
      illustrationTransform: { x: 0, y: 10, scale: 1.65 },
      material: "wood",
    },
  },
  {
    id: "example-view",
    title: "שלט עם נוף",
    caption: "רקע נוף פתוח, טקסט צבעוני למטה — מגנט עדין למרפסת או דלת פנים.",
    previewAriaLabel: "דוגמת שלט עם נוף — כאן גרים באהבה, סגנון רך, מגנט",
    design: {
      creationMode: "photo",
      originalImage: null,
      photoIllustrationStyleId: "style-soft",
      illustration: illustrationForStyle("style-soft"),
      backgroundId: "bg-terrace-view",
      text: {
        value: "כאן גרים באהבה",
        color: multicolorTextColor("ocean"),
        size: 24,
        position: "bottom",
        fontStyle: "personal",
      },
      illustrationTransform: { x: 0, y: 6, scale: 1.55 },
      material: "magnet",
    },
  },
  {
    id: "example-welcome",
    title: "שלט לכניסה",
    caption: "ברכת כניסה בולטת, איור שובב — עץ על רקע שקיעה.",
    previewAriaLabel: "דוגמת שלט לכניסה — ברוכים הבאים, סגנון שובב, רקע שקיעה",
    design: {
      creationMode: "photo",
      originalImage: null,
      photoIllustrationStyleId: "style-playful",
      illustration: illustrationForStyle("style-playful"),
      backgroundId: "bg-sunset-balcony",
      text: {
        value: "ברוכים הבאים",
        color: solidTextColor("#ffffff"),
        size: 26,
        position: "top",
        fontStyle: "clean",
      },
      illustrationTransform: { x: 0, y: 12, scale: 1.6 },
      material: "wood",
    },
  },
];
