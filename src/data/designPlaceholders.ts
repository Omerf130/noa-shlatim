/** Temporary placeholder config — replace with CMS/API data in a later phase. */
export type DesignPlaceholderVariant =
  | "warmSunset"
  | "sageGarden"
  | "terracottaClay"
  | "creamDots"
  | "softBlueHour"
  | "playfulShapes";

export type DesignPlaceholderItem = {
  id: string;
  ariaLabel: string;
  variant: DesignPlaceholderVariant;
};

export const designPlaceholderItems: DesignPlaceholderItem[] = [
  {
    id: "design-warm-sunset",
    ariaLabel: "עיצוב רקע — גוונים חמים",
    variant: "warmSunset",
  },
  {
    id: "design-sage-garden",
    ariaLabel: "עיצוב רקע — ירוק עדין",
    variant: "sageGarden",
  },
  {
    id: "design-terracotta-clay",
    ariaLabel: "עיצוב רקע — טרקוטה",
    variant: "terracottaClay",
  },
  {
    id: "design-cream-dots",
    ariaLabel: "עיצוב רקע — נקודות עדינות",
    variant: "creamDots",
  },
  {
    id: "design-soft-blue-hour",
    ariaLabel: "עיצוב רקע — כחול רך",
    variant: "softBlueHour",
  },
  {
    id: "design-playful-shapes",
    ariaLabel: "עיצוב רקע — צורות משחקיות",
    variant: "playfulShapes",
  },
];
