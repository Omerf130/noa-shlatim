import Link from "next/link";
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge";
import { listAdminOrders } from "@/lib/admin/orders/listAdminOrders";
import styles from "./page.module.scss";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "הזמנות | פאנל ניהול",
};

type OrdersPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const { page: pageParam } = await searchParams;
  const list = await listAdminOrders({ page: pageParam, limit: 20 });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>הזמנות</h1>
        <p className={styles.lead}>הזמנות מהסטודיו — לקריאה בלבד.</p>
      </header>

      {list.items.length === 0 ? (
        <div className={styles.empty} role="status">
          <p>אין הזמנות כרגע.</p>
        </div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">הזמנה</th>
                  <th scope="col">לקוח</th>
                  <th scope="col">טלפון</th>
                  <th scope="col">נוצר</th>
                  <th scope="col">חומר</th>
                  <th scope="col">סה״כ</th>
                  <th scope="col">סטטוס</th>
                  <th scope="col">
                    <span className={styles.srOnly}>פעולה</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((item) => (
                  <tr key={item.orderId}>
                    <td className={styles.mono} dir="ltr">
                      {item.orderReference}
                    </td>
                    <td>{item.customerDisplayName}</td>
                    <td className={styles.mono} dir="ltr">
                      {item.customerPhone ?? "—"}
                    </td>
                    <td>{item.createdAtLabel}</td>
                    <td>{item.materialLabel}</td>
                    <td dir="ltr">{item.totalLabel ?? "—"}</td>
                    <td>
                      <AdminStatusBadge
                        statusKey={item.statusKey}
                        label={item.statusLabel}
                      />
                    </td>
                    <td>
                      <Link href={item.detailHref} className={styles.openLink}>
                        פתיחה
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className={styles.cardList}>
            {list.items.map((item) => (
              <li key={item.orderId} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.mono} dir="ltr">
                    {item.orderReference}
                  </span>
                  <AdminStatusBadge statusKey={item.statusKey} label={item.statusLabel} />
                </div>
                <dl className={styles.cardMeta}>
                  <div>
                    <dt>לקוח</dt>
                    <dd>{item.customerDisplayName}</dd>
                  </div>
                  {item.customerPhone && (
                    <div>
                      <dt>טלפון</dt>
                      <dd dir="ltr">{item.customerPhone}</dd>
                    </div>
                  )}
                  <div>
                    <dt>נוצר</dt>
                    <dd>{item.createdAtLabel}</dd>
                  </div>
                  <div>
                    <dt>חומר</dt>
                    <dd>{item.materialLabel}</dd>
                  </div>
                  <div>
                    <dt>סה״כ</dt>
                    <dd dir="ltr">{item.totalLabel ?? "—"}</dd>
                  </div>
                </dl>
                <Link href={item.detailHref} className={styles.openLink}>
                  פתיחה
                </Link>
              </li>
            ))}
          </ul>

          {list.totalPages > 1 && (
            <nav className={styles.pagination} aria-label="עימוד הזמנות">
              <p className={styles.pageIndicator}>
                עמוד {list.page} מתוך {list.totalPages}
              </p>
              <div className={styles.paginationActions}>
                {list.page > 1 ? (
                  <Link
                    href={`/admin/orders?page=${list.page - 1}`}
                    className={styles.pageBtn}
                  >
                    הקודם
                  </Link>
                ) : (
                  <span className={styles.pageBtnDisabled}>הקודם</span>
                )}
                {list.page < list.totalPages ? (
                  <Link
                    href={`/admin/orders?page=${list.page + 1}`}
                    className={styles.pageBtn}
                  >
                    הבא
                  </Link>
                ) : (
                  <span className={styles.pageBtnDisabled}>הבא</span>
                )}
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
