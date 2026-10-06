import { LEGACY_BACKGROUND_SEEDS } from "@/lib/backgrounds/legacyBackgroundSeed";

/** Static preview paths for dashboard management tiles — legacy catalog assets only. */
export function dashboardBackgroundPreviewThumbs(): { src: string; alt: string }[] {
  return LEGACY_BACKGROUND_SEEDS.slice(0, 3).map((b) => ({
    src: b.imageSrc,
    alt: b.alt,
  }));
}

export const DASHBOARD_CONTENT_PREVIEW_IMAGE = "/examples/1.png";
export const DASHBOARD_STORE_PREVIEW_IMAGE = "/examples/2.png";
