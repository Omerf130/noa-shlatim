import type { BackgroundStorageKind } from "@/models/Background";

export type LegacyBackgroundSeedEntry = {
  id: string;
  displayName: string;
  imageSrc: string;
  sortOrder: number;
  objectPosition: string;
  alt: string;
  storageKind: BackgroundStorageKind;
};

function backgroundPublicPath(fileName: string): string {
  return `/backgrounds/${encodeURIComponent(fileName)}`;
}

/** Canonical seed for the 8 shipped public backgrounds — IDs must never change. */
export const LEGACY_BACKGROUND_SEEDS: LegacyBackgroundSeedEntry[] = [
  {
    id: "bg-garden-courtyard",
    displayName: "חצר עם זית",
    imageSrc: backgroundPublicPath("ChatGPT Image Sep 24, 2026, 10_47_58 PM.png"),
    alt: "רקע שלט — חצר גינה עם קיר אבן, זית ופרחים לבנים",
    objectPosition: "50% 42%",
    sortOrder: 1,
    storageKind: "public",
  },
  {
    id: "bg-terrace-view",
    displayName: "מרפסת עם נוף",
    imageSrc: backgroundPublicPath("ChatGPT Image Sep 24, 2026, 10_49_07 PM.png"),
    alt: "רקע שלט — מרפסת עם גפנים, פרחים ונוף למים ולהרים",
    objectPosition: "50% 45%",
    sortOrder: 2,
    storageKind: "public",
  },
  {
    id: "bg-sunset-balcony",
    displayName: "שקיעה על המרפסת",
    imageSrc: backgroundPublicPath("ChatGPT Image Sep 24, 2026, 10_54_07 PM.png"),
    alt: "רקע שלט — מרפסת אבן בשעת שקיעה עם נוף לעיר ולים",
    objectPosition: "50% 40%",
    sortOrder: 3,
    storageKind: "public",
  },
  {
    id: "bg-tropical-beach",
    displayName: "חוף טרופי",
    imageSrc: backgroundPublicPath("ChatGPT Image Sep 27, 2026, 06_12_46 PM.png"),
    alt: "רקע שלט — חוף טרופי עם דקלים, חול לבן ומים טורקיז",
    objectPosition: "50% 45%",
    sortOrder: 4,
    storageKind: "public",
  },
  {
    id: "bg-sunset-beach",
    displayName: "שקיעה בחוף",
    imageSrc: backgroundPublicPath("ChatGPT Image Sep 27, 2026, 06_15_14 PM.png"),
    alt: "רקע שלט — חוף בשקיעה עם פרגולה, דקלים וים זהוב",
    objectPosition: "50% 42%",
    sortOrder: 5,
    storageKind: "public",
  },
  {
    id: "bg-warm-living-room",
    displayName: "סלון חמים",
    imageSrc: backgroundPublicPath("ChatGPT Image Sep 27, 2026, 06_17_07 PM.png"),
    alt: "רקע שלט — סלון חמים עם ספרים, צמחים ואור שמש",
    objectPosition: "50% 48%",
    sortOrder: 6,
    storageKind: "public",
  },
  {
    id: "bg-mediterranean-courtyard",
    displayName: "חצר ים־תיכונית",
    imageSrc: backgroundPublicPath("ChatGPT Image Sep 27, 2026, 06_18_12 PM.png"),
    alt: "רקע שלט — חצר אבן ים־תיכונית עם בוגנוויליה ונוף לים",
    objectPosition: "50% 45%",
    sortOrder: 7,
    storageKind: "public",
  },
  {
    id: "bg-camping-nature",
    displayName: "קמפינג בטבע",
    imageSrc: backgroundPublicPath("ChatGPT Image Sep 27, 2026, 06_18_47 PM.png"),
    alt: "רקע שלט — מחנה אוהלים ליד אגם והרים בשקיעה",
    objectPosition: "50% 40%",
    sortOrder: 8,
    storageKind: "public",
  },
];
