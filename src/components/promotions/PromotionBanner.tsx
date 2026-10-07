import {
  BANNER_STATIC_DESKTOP_CYCLE_REPEATS,
  BANNER_STATIC_MOBILE_CYCLE_REPEATS,
  expandStaticBannerVisualSequence,
  staticBannerAccessibleSummary,
} from "@/lib/promotions/buildStaticBannerVisualSequence";
import type { PublicPromotionBannerDto } from "@/lib/promotions/publicPromotionBannerDto";
import styles from "./PromotionBanner.module.scss";

type PromotionBannerProps = {
  dto: PublicPromotionBannerDto;
};

function BannerVisualStrip({ labels }: { labels: string[] }) {
  return (
    <>
      {labels.map((text, index) => (
        <span className={styles.unit} key={`${index}-${text}`}>
          <span className={styles.item}>{text}</span>
          {index < labels.length - 1 ? (
            <span className={styles.separator} aria-hidden="true">
              •
            </span>
          ) : null}
        </span>
      ))}
    </>
  );
}

export function PromotionBanner({ dto }: PromotionBannerProps) {
  const baseCycle = dto.items
    .map((item) => item.bannerText.trim())
    .filter((text) => text.length > 0);

  if (baseCycle.length === 0) {
    return null;
  }

  const desktopLabels = expandStaticBannerVisualSequence(
    baseCycle,
    BANNER_STATIC_DESKTOP_CYCLE_REPEATS,
  );
  const mobileLabels = expandStaticBannerVisualSequence(
    baseCycle,
    BANNER_STATIC_MOBILE_CYCLE_REPEATS,
  );

  return (
    <div className={styles.banner} role="region" aria-label="מבצעים">
      <p className={styles.srOnly}>{staticBannerAccessibleSummary(baseCycle)}</p>
      <div className={`${styles.content} ${styles.contentDesktop}`} aria-hidden="true">
        <BannerVisualStrip labels={desktopLabels} />
      </div>
      <div className={`${styles.content} ${styles.contentMobile}`} aria-hidden="true">
        <BannerVisualStrip labels={mobileLabels} />
      </div>
    </div>
  );
}
