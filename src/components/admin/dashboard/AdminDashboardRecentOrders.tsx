import type { AdminDashboardRecentOrderDto } from "@/lib/admin/dashboard/adminDashboardDtos";
import type { DashboardWorkflowStatusPresentation } from "@/lib/admin/dashboard/adminDashboardOrderPresentation";
import { Check, Clock } from "lucide-react";
import Link from "next/link";
import styles from "./AdminDashboardRecentOrders.module.scss";

type AdminDashboardRecentOrdersProps = {
  orders: AdminDashboardRecentOrderDto[];
};

function PaymentStatusBadge({
  payment,
}: {
  payment: AdminDashboardRecentOrderDto["paymentStatus"];
}) {
  const toneClass =
    payment.key === "paid"
      ? styles.payPaid
      : payment.key === "payment_pending"
        ? styles.payPending
        : styles.payNeutral;

  return (
    <span className={`${styles.payBadge} ${toneClass}`}>
      {payment.showCheck ? <Check size={11} strokeWidth={2.5} aria-hidden /> : null}
      {payment.showClock ? <Clock size={11} strokeWidth={2.25} aria-hidden /> : null}
      {payment.label}
    </span>
  );
}

function WorkflowStatusBadge({ workflow }: { workflow: DashboardWorkflowStatusPresentation }) {
  const toneClass = {
    blue: styles.flowBlue,
    tan: styles.flowTan,
    purple: styles.flowPurple,
    neutral: styles.flowNeutral,
    amber: styles.flowAmber,
  }[workflow.tone];

  return (
    <span className={`${styles.flowBadge} ${toneClass}`}>{workflow.label}</span>
  );
}

export function AdminDashboardRecentOrders({ orders }: AdminDashboardRecentOrdersProps) {
  return (
    <section className={styles.panel} aria-labelledby="recent-orders-heading">
      <div className={styles.panelHead}>
        <h2 id="recent-orders-heading" className={styles.title}>
          ההזמנות האחרונות
        </h2>
        <Link href="/admin/orders" className={styles.headCta}>
          כל ההזמנות ←
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className={styles.empty} role="status">
          אין הזמנות להצגה.
        </p>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col"># הזמנה</th>
                  <th scope="col">תאריך</th>
                  <th scope="col">לקוח</th>
                  <th scope="col">מוצר</th>
                  <th scope="col">סה״כ</th>
                  <th scope="col">סטטוס תשלום</th>
                  <th scope="col">סטטוס הזמנה</th>
                  <th scope="col">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((row) => (
                  <tr key={row.orderId}>
                    <td className={styles.ref} dir="ltr">
                      {row.orderReference}
                    </td>
                    <td className={styles.dateCell}>
                      <span className={styles.dateLine}>{row.createdAtDateLine}</span>
                      <span className={styles.timeLine} dir="ltr">
                        {row.createdAtTimeLine}
                      </span>
                    </td>
                    <td className={styles.customerCell}>
                      <span className={styles.customerName}>{row.customerDisplayName}</span>
                      {row.customerEmail ? (
                        <span className={styles.customerMeta} dir="ltr">
                          {row.customerEmail}
                        </span>
                      ) : null}
                    </td>
                    <td className={styles.productCell}>
                      {row.artworkThumbnailUrl ? (
                        <span className={styles.thumbFrame}>
                          {/* Full-resolution private artwork; CSS sizes display only */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={row.artworkThumbnailUrl}
                            alt=""
                            className={styles.thumb}
                            width={76}
                            height={51}
                            decoding="async"
                          />
                        </span>
                      ) : (
                        <span className={styles.thumbEmpty} aria-hidden />
                      )}
                    </td>
                    <td className={styles.amount} dir="ltr">
                      {row.totalLabel ?? "—"}
                    </td>
                    <td>
                      <PaymentStatusBadge payment={row.paymentStatus} />
                    </td>
                    <td>
                      <WorkflowStatusBadge workflow={row.workflowStatus} />
                    </td>
                    <td>
                      <Link href={row.detailHref} className={styles.viewBtn}>
                        צפייה
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className={styles.mobileList}>
            {orders.map((row) => (
              <li key={row.orderId}>
                <Link href={row.detailHref} className={styles.mobileCard}>
                  <div className={styles.mobileTop}>
                    {row.artworkThumbnailUrl ? (
                      <span className={styles.thumbFrameMobile}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={row.artworkThumbnailUrl}
                          alt=""
                          className={styles.thumbMobile}
                          width={64}
                          height={43}
                          decoding="async"
                        />
                      </span>
                    ) : (
                      <span className={styles.thumbEmptyMobile} aria-hidden />
                    )}
                    <div className={styles.mobileCopy}>
                      <span className={styles.customerName} dir="ltr">
                        {row.orderReference}
                      </span>
                      <span className={styles.mobileMeta}>{row.customerDisplayName}</span>
                      <span className={styles.mobileMeta}>
                        {row.createdAtDateLine} · {row.createdAtTimeLine}
                      </span>
                    </div>
                  </div>
                  <div className={styles.mobileBadges}>
                    <PaymentStatusBadge payment={row.paymentStatus} />
                    <WorkflowStatusBadge workflow={row.workflowStatus} />
                  </div>
                  <div className={styles.mobileBottom}>
                    <span dir="ltr">{row.totalLabel ?? "—"}</span>
                    <span className={styles.viewBtn}>צפייה</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
