"use client";

import { AdminOrderPreview } from "@/components/admin/orders/AdminOrderPreview";
import type { AdminOrderDetailDto } from "@/lib/admin/orders/adminOrderDtos";
import styles from "./AdminOrderDetailContent.module.scss";

type AdminOrderDetailContentProps = {
  dto: AdminOrderDetailDto;
};

function fieldValue(value: string | null): string {
  return value?.trim() ? value : "—";
}

export function AdminOrderDetailContent({ dto }: AdminOrderDetailContentProps) {
  const isPhoto = dto.creationMode === "photo";
  const originalAssetCaption = isPhoto ? "תמונת מקור" : "איור מקור";
  const originalAssetAlt = isPhoto
    ? "תמונת מקור של הלקוח"
    : "איור מקור של הלקוח";
  const originalAssetMissing = isPhoto
    ? "תמונת מקור אינה זמינה."
    : "איור מקור אינו זמין.";

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <h1 className={styles.title}>הזמנה {dto.orderReference}</h1>
          <span className={styles.statusBadge}>{dto.statusLabel}</span>
        </div>
        <dl className={styles.meta}>
          <div>
            <dt>נוצר</dt>
            <dd>{dto.createdAtLabel}</dd>
          </div>
          <div>
            <dt>עודכן</dt>
            <dd>{dto.updatedAtLabel}</dd>
          </div>
          <div>
            <dt>מזהה</dt>
            <dd className={styles.mono} dir="ltr">
              {dto.orderId}
            </dd>
          </div>
          <div>
            <dt>סוג יצירה</dt>
            <dd>{dto.creationModeLabel}</dd>
          </div>
        </dl>
      </header>

      <section className={styles.section} aria-labelledby="final-sign-heading">
        <h2 id="final-sign-heading" className={styles.sectionTitle}>
          השלט כפי שאושר על ידי הלקוח
        </h2>
        {dto.designPreview ? (
          <div className={styles.previewWrap}>
            <AdminOrderPreview preview={dto.designPreview} />
          </div>
        ) : (
          <p className={styles.unavailable} role="status">
            {dto.designPreviewUnavailableMessage}
          </p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="customer-heading">
        <h2 id="customer-heading" className={styles.sectionTitle}>
          פרטי לקוח
        </h2>
        <dl className={styles.fieldList}>
          <div>
            <dt>שם מלא</dt>
            <dd>{fieldValue(dto.customer.fullName)}</dd>
          </div>
          <div>
            <dt>טלפון</dt>
            <dd dir="ltr" className={styles.mono}>
              {fieldValue(dto.customer.phone)}
            </dd>
          </div>
          <div>
            <dt>אימייל</dt>
            <dd dir="ltr" className={styles.mono}>
              {fieldValue(dto.customer.email)}
            </dd>
          </div>
          <div>
            <dt>הערות הלקוח</dt>
            <dd>{dto.customerNotes.trim() ? dto.customerNotes : "—"}</dd>
          </div>
        </dl>
      </section>

      {dto.designPreview && (
        <section className={styles.section} aria-labelledby="design-heading">
          <h2 id="design-heading" className={styles.sectionTitle}>
            פרטי עיצוב
          </h2>
          <dl className={styles.fieldList}>
            <div>
              <dt>חומר</dt>
              <dd>{dto.designPreview.materialLabel}</dd>
            </div>
            <div>
              <dt>רקע</dt>
              <dd>{dto.designPreview.backgroundName}</dd>
            </div>
            {dto.designPreview.styleName && (
              <div>
                <dt>סגנון איור</dt>
                <dd>{dto.designPreview.styleName}</dd>
              </div>
            )}
            <div>
              <dt>טקסט השלט</dt>
              <dd>{dto.designPreview.signText}</dd>
            </div>
            <div>
              <dt>קישוטים</dt>
              <dd>{dto.designPreview.decorationSummary}</dd>
            </div>
          </dl>
        </section>
      )}

      <section className={styles.section} aria-labelledby="assets-heading">
        <h2 id="assets-heading" className={styles.sectionTitle}>
          נכסי ייצור
        </h2>
        <div className={styles.assetsGrid}>
          {dto.productionAssets.originalImageUrl ? (
            <figure className={styles.assetFigure}>
              <figcaption>{originalAssetCaption}</figcaption>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dto.productionAssets.originalImageUrl}
                alt={originalAssetAlt}
                className={styles.assetImg}
              />
            </figure>
          ) : (
            <p className={styles.missingAsset}>{originalAssetMissing}</p>
          )}
          {dto.productionAssets.artworkUrl ? (
            <figure className={styles.assetFigure}>
              <figcaption>Artwork שנוצר ב-AI</figcaption>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dto.productionAssets.artworkUrl}
                alt="Artwork שנוצר ב-AI"
                className={styles.assetImg}
              />
            </figure>
          ) : (
            <p className={styles.missingAsset}>Artwork אינו זמין.</p>
          )}
        </div>
      </section>
    </div>
  );
}
