import {
  signBackgroundVariantItems,
  type SignBackgroundVariant,
} from "./signBackgroundVariants";

/** Homepage grid — legacy CSS variants; visual pass later. */
export type DesignPlaceholderVariant = SignBackgroundVariant;

export type DesignPlaceholderItem = {
  id: string;
  ariaLabel: string;
  variant: DesignPlaceholderVariant;
};

export const designPlaceholderItems: DesignPlaceholderItem[] =
  signBackgroundVariantItems.map((bg) => ({
    id: bg.id,
    ariaLabel: `עיצוב רקע — ${bg.name}`,
    variant: bg.variant,
  }));
