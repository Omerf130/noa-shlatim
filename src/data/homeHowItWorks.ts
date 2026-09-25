import type { LucideIcon } from "lucide-react";
import { ImagePlus, PackageCheck, Palette, Sparkles } from "lucide-react";

export type HomeHowItWorksStep = {
  id: string;
  title: string;
  description: string;
  Icon: LucideIcon;
};

export const homeHowItWorksSteps: HomeHowItWorksStep[] = [
  {
    id: "upload",
    title: "מעלים תמונה",
    description: "תמונת משפחה, זוג או חיית מחמד — נקודת ההתחלה.",
    Icon: ImagePlus,
  },
  {
    id: "illustrate",
    title: "יוצרים איור",
    description: "בוחרים סגנון והמערכת יוצרת איור מבודד מהתמונה.",
    Icon: Sparkles,
  },
  {
    id: "design",
    title: "מעצבים את השלט",
    description: "רקע, טקסט, צבעים ומיקום — רואים הכל בזמן אמת.",
    Icon: Palette,
  },
  {
    id: "order",
    title: "מזמינים ומקבלים",
    description: "בודקים את השלט וממשיכים להזמנה כשתהיו מוכנים.",
    Icon: PackageCheck,
  },
];
