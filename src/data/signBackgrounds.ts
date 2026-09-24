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
