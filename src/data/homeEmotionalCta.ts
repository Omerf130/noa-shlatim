import { homePrimaryCta } from "@/data/homeNav";
import { publicAssetPath } from "@/lib/home/publicAssetPath";

export const homeEmotionalCta = {
  imageSrc: publicAssetPath(
    "backgrounds/ChatGPT Image Sep 24, 2026, 10_54_07 PM.png",
  ),
  imageAlt: "מרפסת חמה בשעת שקיעה — אווירה ביתית",
  objectPosition: "50% 40%",
  title: "יוצרים שלט שמרגיש כמו בית",
  text: "מהתמונה שלכם לשלט מאויר על הדלת — בדרך שמרגישה אישית מהרגע הראשון.",
  cta: homePrimaryCta,
} as const;
