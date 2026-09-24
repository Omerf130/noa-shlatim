/** Shared sign background catalog — CSS placeholders now; imageUrl for future CMS/DB. */
export type SignBackgroundVariant =
  | "warmSunset"
  | "sageGarden"
  | "terracottaClay"
  | "creamDots"
  | "softBlueHour"
  | "playfulShapes";

export type SignBackground = {
  id: string;
  name: string;
  variant: SignBackgroundVariant;
  imageUrl?: string | null;
};

export const signBackgrounds: SignBackground[] = [
  { id: "bg-warm-sunset", name: "שקיעה חמה", variant: "warmSunset", imageUrl: null },
  { id: "bg-sage-garden", name: "גינה ירוקה", variant: "sageGarden", imageUrl: null },
  { id: "bg-terracotta-clay", name: "טרקוטה", variant: "terracottaClay", imageUrl: null },
  { id: "bg-cream-dots", name: "קרם ונקודות", variant: "creamDots", imageUrl: null },
  { id: "bg-soft-blue-hour", name: "כחול רך", variant: "softBlueHour", imageUrl: null },
  { id: "bg-playful-shapes", name: "צורות משחקיות", variant: "playfulShapes", imageUrl: null },
];

export function getBackgroundById(id: string | null): SignBackground | undefined {
  if (!id) return undefined;
  return signBackgrounds.find((b) => b.id === id);
}
