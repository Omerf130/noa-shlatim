/** Legacy CSS placeholder variants — homepage grid only (not builder catalog). */

export type SignBackgroundVariant =
  | "warmSunset"
  | "sageGarden"
  | "terracottaClay"
  | "creamDots"
  | "softBlueHour"
  | "playfulShapes";

export type SignBackgroundVariantItem = {
  id: string;
  name: string;
  variant: SignBackgroundVariant;
};

export const signBackgroundVariantItems: SignBackgroundVariantItem[] = [
  { id: "bg-warm-sunset", name: "שקיעה חמה", variant: "warmSunset" },
  { id: "bg-sage-garden", name: "גינה ירוקה", variant: "sageGarden" },
  { id: "bg-terracotta-clay", name: "טרקוטה", variant: "terracottaClay" },
  { id: "bg-cream-dots", name: "קרם ונקודות", variant: "creamDots" },
  { id: "bg-soft-blue-hour", name: "כחול רך", variant: "softBlueHour" },
  { id: "bg-playful-shapes", name: "צורות משחקיות", variant: "playfulShapes" },
];
