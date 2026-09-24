import { signBackgrounds, type SignBackgroundVariant } from "./signBackgrounds";

/** Homepage grid — derived from shared background catalog. */
export type DesignPlaceholderVariant = SignBackgroundVariant;

export type DesignPlaceholderItem = {
  id: string;
  ariaLabel: string;
  variant: DesignPlaceholderVariant;
};

export const designPlaceholderItems: DesignPlaceholderItem[] = signBackgrounds.map(
  (bg) => ({
    id: bg.id,
    ariaLabel: `עיצוב רקע — ${bg.name}`,
    variant: bg.variant,
  }),
);
