import { illustrationStyles } from "@/data/illustrationStyles";
import { listActiveBackgrounds } from "@/data/signBackgrounds";

/** Static preview paths for dashboard management tiles — catalog assets only. */
export function dashboardBackgroundPreviewThumbs(): { src: string; alt: string }[] {
  return listActiveBackgrounds()
    .slice(0, 3)
    .map((b) => ({ src: b.imageSrc, alt: b.alt }));
}

export function dashboardIllustrationStylePreviews(): {
  id: string;
  name: string;
  variant: "classic" | "soft" | "playful";
}[] {
  return illustrationStyles.map((s) => ({
    id: s.id,
    name: s.name,
    variant: s.cardVariant,
  }));
}

export const DASHBOARD_CONTENT_PREVIEW_IMAGE = "/examples/1.png";
export const DASHBOARD_STORE_PREVIEW_IMAGE = "/examples/2.png";
