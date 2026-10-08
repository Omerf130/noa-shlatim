import { AdminDiagnosticsView } from "@/components/admin/diagnostics/AdminDiagnosticsView";
import { listOperationFailureTraces } from "@/lib/admin/diagnostics/listOperationFailureTraces";
import styles from "./page.module.scss";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "תקלות מערכת | פאנל ניהול",
};

type DiagnosticsPageProps = {
  searchParams: Promise<{ operation?: string; trace?: string }>;
};

export default async function AdminDiagnosticsPage({
  searchParams,
}: DiagnosticsPageProps) {
  const params = await searchParams;
  const list = await listOperationFailureTraces({
    operation: params.operation,
    trace: params.trace,
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>תקלות מערכת</h1>
        <p className={styles.lead}>
          רישום תקלות אחרונות לפי traceId — ללא נתוני לקוחות או קבצים.
        </p>
      </header>
      <AdminDiagnosticsView
        items={list.items}
        operationFilter={list.operationFilter}
        traceSearch={list.traceSearch}
      />
    </div>
  );
}
