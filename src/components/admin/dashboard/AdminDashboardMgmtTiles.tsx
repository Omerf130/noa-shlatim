import { BrandLogo } from "@/components/brand/BrandLogo/BrandLogo";
import {
  dashboardBackgroundPreviewThumbs,
  DASHBOARD_CONTENT_PREVIEW_IMAGE,
  DASHBOARD_STORE_PREVIEW_IMAGE,
} from "@/lib/admin/dashboard/adminDashboardMgmtPreviews";
import { FileText, Image, Package, Store } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./AdminDashboardMgmtTiles.module.scss";

export function AdminDashboardMgmtTiles() {
  const backgrounds = dashboardBackgroundPreviewThumbs();

  return (
    <section className={styles.section} aria-labelledby="mgmt-heading">
      <h2 id="mgmt-heading" className={styles.heading}>
        ניהול מהיר
      </h2>
      <div className={styles.grid}>
        <MgmtLiveTile
          title="תוכן האתר"
          description="טקסטים ודפי מידע"
          href="/admin/content"
          icon={FileText}
        >
          <div className={styles.contentPreview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={DASHBOARD_CONTENT_PREVIEW_IMAGE} alt="" className={styles.contentImg} />
            <div className={styles.contentType}>
              <span className={styles.typeLine} />
              <span className={styles.typeLineShort} />
              <span className={styles.typeTitle}>שלטים לדלת</span>
            </div>
          </div>
        </MgmtLiveTile>

        <MgmtLiveTile
          title="חומרים"
          description="עץ ומגנט"
          href="/admin/materials"
          icon={Package}
        >
          <div className={styles.materialPreview}>
            <span className={styles.swatchWood} title="עץ" />
            <span className={styles.swatchMagnet} title="מגנט" />
          </div>
        </MgmtLiveTile>

        <MgmtLiveTile
          title="רקעים"
          description="קטלוג רקעים לשלט"
          href="/admin/backgrounds"
          icon={Image}
        >
          <div className={styles.bgStrip}>
            {backgrounds.map((b) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={b.src} src={b.src} alt="" className={styles.bgThumb} />
            ))}
          </div>
        </MgmtLiveTile>

        <MgmtLiveTile
          title="הגדרות חנות"
          description="מחירים, משלוחים וקופה"
          href="/admin/store-settings"
          icon={Store}
        >
          <div className={styles.storePreview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={DASHBOARD_STORE_PREVIEW_IMAGE} alt="" className={styles.storeImg} />
            <BrandLogo variant="compact" asLink={false} className={styles.storeLogo} />
          </div>
        </MgmtLiveTile>
      </div>
    </section>
  );
}

function MgmtLiveTile({
  title,
  description,
  href,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  href: string;
  icon: typeof Store;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={styles.tileLive}>
      <div className={styles.tileHead}>
        <span className={`${styles.tileIcon} ${styles.tileIconLive}`}>
          <Icon size={14} strokeWidth={1.75} aria-hidden />
        </span>
        <div>
          <h3 className={styles.tileTitle}>{title}</h3>
          <p className={styles.tileDesc}>{description}</p>
        </div>
      </div>
      <div className={styles.previewArea}>{children}</div>
      <span className={styles.liveCta}>לניהול הגדרות ←</span>
    </Link>
  );
}
