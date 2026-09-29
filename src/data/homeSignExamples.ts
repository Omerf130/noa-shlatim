import { publicAssetPath } from "@/lib/home/publicAssetPath";

export type HomeSignExampleItem = {
  id: string;
  title: string;
  caption: string;
  previewAriaLabel: string;
  finishedSignImageSrc: string;
};

/** Finished-sign marketing examples — explicit assets in public/examples/. */
const finishedSignExamples = {
  familyCourtyard: publicAssetPath(
    "examples/ChatGPT Image Sep 29, 2026, 03_16_34 PM.png",
  ),
  familySunsetView: publicAssetPath(
    "examples/ChatGPT Image Sep 29, 2026, 03_16_37 PM.png",
  ),
  familyEntry: publicAssetPath(
    "examples/ChatGPT Image Sep 29, 2026, 03_16_48 PM.png",
  ),
} as const;

export const homeSignExamples: HomeSignExampleItem[] = [
  {
    id: "example-family",
    title: "שלט משפחתי",
    caption: "שם המשפחה בראש השלט, האיור במרכז — עץ חם לכניסה ביתית.",
    previewAriaLabel: "דוגמת שלט משפחתי — משפחת לוי, חצר ביתית, שלט עץ",
    finishedSignImageSrc: finishedSignExamples.familyCourtyard,
  },
  {
    id: "example-view",
    title: "שלט עם נוף",
    caption: "רקע נוף פתוח, טקסט צבעוני למטה — מגנט עדין למרפסת או דלת פנים.",
    previewAriaLabel: "דוגמת שלט עם נוף — משפחת כהן, נוף שקיעה, שלט עץ",
    finishedSignImageSrc: finishedSignExamples.familySunsetView,
  },
  {
    id: "example-welcome",
    title: "שלט לכניסה",
    caption: "ברכת כניסה בולטת, איור שובב — עץ חם על רקע כניסה ביתית.",
    previewAriaLabel: "דוגמת שלט לכניסה — משפחת כהן, דלת כניסה, שלט עץ",
    finishedSignImageSrc: finishedSignExamples.familyEntry,
  },
];
