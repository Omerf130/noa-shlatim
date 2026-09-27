import type { SignBackground } from "@/types/signBackground";

function backgroundPublicPath(fileName: string): string {
  return `/backgrounds/${encodeURIComponent(fileName)}`;
}

/** Static catalog — replace source with admin/API later; same shape. */
const catalog: SignBackground[] = [
  {
    id: "bg-garden-courtyard",
    name: "חצר עם זית",
    imageSrc: backgroundPublicPath("ChatGPT Image Sep 24, 2026, 10_47_58 PM.png"),
    alt: "רקע שלט — חצר גינה עם קיר אבן, זית ופרחים לבנים",
    objectPosition: "50% 42%",
    sortOrder: 1,
    active: true,
  },
  {
    id: "bg-terrace-view",
    name: "מרפסת עם נוף",
    imageSrc: backgroundPublicPath("ChatGPT Image Sep 24, 2026, 10_49_07 PM.png"),
    alt: "רקע שלט — מרפסת עם גפנים, פרחים ונוף למים ולהרים",
    objectPosition: "50% 45%",
    sortOrder: 2,
    active: true,
  },
  {
    id: "bg-sunset-balcony",
    name: "שקיעה על המרפסת",
    imageSrc: backgroundPublicPath("ChatGPT Image Sep 24, 2026, 10_54_07 PM.png"),
    alt: "רקע שלט — מרפסת אבן בשעת שקיעה עם נוף לעיר ולים",
    objectPosition: "50% 40%",
    sortOrder: 3,
    active: true,
  },
  {
    id: "bg-tropical-beach",
    name: "חוף טרופי",
    imageSrc: backgroundPublicPath("ChatGPT Image Sep 27, 2026, 06_12_46 PM.png"),
    alt: "רקע שלט — חוף טרופי עם דקלים, חול לבן ומים טורקיז",
    objectPosition: "50% 45%",
    sortOrder: 4,
    active: true,
  },
  {
    id: "bg-sunset-beach",
    name: "שקיעה בחוף",
    imageSrc: backgroundPublicPath("ChatGPT Image Sep 27, 2026, 06_15_14 PM.png"),
    alt: "רקע שלט — חוף בשקיעה עם פרגולה, דקלים וים זהוב",
    objectPosition: "50% 42%",
    sortOrder: 5,
    active: true,
  },
  {
    id: "bg-warm-living-room",
    name: "סלון חמים",
    imageSrc: backgroundPublicPath("ChatGPT Image Sep 27, 2026, 06_17_07 PM.png"),
    alt: "רקע שלט — סלון חמים עם ספרים, צמחים ואור שמש",
    objectPosition: "50% 48%",
    sortOrder: 6,
    active: true,
  },
  {
    id: "bg-mediterranean-courtyard",
    name: "חצר ים־תיכונית",
    imageSrc: backgroundPublicPath("ChatGPT Image Sep 27, 2026, 06_18_12 PM.png"),
    alt: "רקע שלט — חצר אבן ים־תיכונית עם בוגנוויליה ונוף לים",
    objectPosition: "50% 45%",
    sortOrder: 7,
    active: true,
  },
  {
    id: "bg-camping-nature",
    name: "קמפינג בטבע",
    imageSrc: backgroundPublicPath("ChatGPT Image Sep 27, 2026, 06_18_47 PM.png"),
    alt: "רקע שלט — מחנה אוהלים ליד אגם והרים בשקיעה",
    objectPosition: "50% 40%",
    sortOrder: 8,
    active: true,
  },
];

export function listActiveBackgrounds(): SignBackground[] {
  return catalog.filter((b) => b.active).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getBackgroundById(id: string | null): SignBackground | undefined {
  if (!id) return undefined;
  return catalog.find((b) => b.id === id);
}

/** @deprecated Use listActiveBackgrounds — kept for imports that expected an array. */
export const signBackgrounds = listActiveBackgrounds();
