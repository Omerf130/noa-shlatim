import { publicAssetPath } from "@/lib/home/publicAssetPath";

/**
 * Homepage hero scene image — swap `imageSrc` / `objectPosition` when the final asset is ready.
 * (Temporary: garden background until dedicated entrance + sign hero PNG exists.)
 */
export const homeHeroMedia = {
  imageSrc: publicAssetPath(
    "backgrounds/ChatGPT Image Sep 24, 2026, 10_47_58 PM.png",
  ),
  imageAlt: "אווירת בית חם — רקע זמני לשלט דלת מותאם אישית",
  objectPosition: "50% 42%",
} as const;

export const homeHeroAccentLine = "הבית שלכם, הסיפור שלכם";

export const homeHeroValueItems = [
  { id: "personal", label: "עיצוב אישי באמת" },
  { id: "process", label: "תהליך פשוט וברור" },
  { id: "material", label: "עץ או מגנט" },
] as const;

export type HomeHeroValueItemId = (typeof homeHeroValueItems)[number]["id"];
