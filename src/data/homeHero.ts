import { publicAssetPath } from "@/lib/home/publicAssetPath";

/** Dedicated homepage Hero — full entrance scene with mounted sign. */
export const homeHeroScene = {
  imageSrc: publicAssetPath(
    "backgrounds/ChatGPT Image Sep 29, 2026, 01_59_26 PM.png",
  ),
  imageAlt: "שלט לדלת בעיצוב אישי עם איור משפחתי בכניסה לבית",
  /** Keeps mounted sign + door visible in cover crop (physical left-weighted). */
  objectPosition: "38% 46%",
} as const;

export const homeHeroAccentLine = "הבית שלכם, הסיפור שלכם";

export const homeHeroValueItems = [
  { id: "personal", label: "עיצוב אישי באמת" },
  { id: "process", label: "תהליך פשוט וברור" },
  { id: "material", label: "מגנט לדלת" },
] as const;

export type HomeHeroValueItemId = (typeof homeHeroValueItems)[number]["id"];
