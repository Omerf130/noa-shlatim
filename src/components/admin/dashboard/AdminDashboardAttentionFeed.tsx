import type { DashboardAttentionItemDto } from "@/lib/admin/dashboard/getDashboardAttentionItems";
import { Bell, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import styles from "./AdminDashboardAttentionFeed.module.scss";

type AdminDashboardAttentionFeedProps = {
  attentionCount: number;
  items: DashboardAttentionItemDto[];
};

export function AdminDashboardAttentionFeed({
  attentionCount,
  items,
}: AdminDashboardAttentionFeedProps) {
  return (
    <section className={styles.panel} aria-labelledby="attention-heading">
      <div className={styles.panelHead}>
        <div className={styles.titleRow}>
          <h2 id="attention-heading" className={styles.title}>
            דורש טיפול
          </h2>
          <span className={styles.bellWrap}>
            <Bell size={16} strokeWidth={2} className={styles.bellIcon} />
            {attentionCount > 0 ? (
              <span className={styles.countBadge} aria-label={`${attentionCount} פריטים`}>
                {attentionCount}
              </span>
            ) : null}
          </span>
        </div>
      </div>

      <div className={styles.body}>
        {items.length === 0 ? (
          <div className={styles.empty} role="status">
            <CheckCircle2 size={16} strokeWidth={2} className={styles.emptyIcon} aria-hidden />
            <p className={styles.emptyTitle}>אין הזמנות שממתינות לטיפול</p>
          </div>
        ) : (
          <ul className={styles.feed}>
            {items.map((item) => (
              <li key={item.orderId}>
                <Link href={item.detailHref} className={styles.feedItem}>
                  {item.artworkThumbnailUrl ? (
                    <span className={styles.thumbFrame}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.artworkThumbnailUrl}
                        alt=""
                        className={styles.thumb}
                        width={48}
                        height={32}
                        decoding="async"
                      />
                    </span>
                  ) : (
                    <span className={styles.thumbEmpty} aria-hidden />
                  )}
                  <div className={styles.feedBody}>
                    <span className={styles.feedRef} dir="ltr">
                      {item.orderReference}
                    </span>
                    <span className={styles.feedIssue}>{item.issueLabel}</span>
                    <span className={styles.feedDate}>{item.attentionDateLabel}</span>
                  </div>
                  <span className={styles.dot} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link href="/admin/orders" className={styles.footerCta}>
        צפייה בכל ההזמנות
      </Link>
    </section>
  );
}
