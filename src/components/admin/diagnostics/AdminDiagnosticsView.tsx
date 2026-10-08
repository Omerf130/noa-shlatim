"use client";

import type { AdminOperationFailureRow } from "@/lib/admin/diagnostics/listOperationFailureTraces";
import { DIAGNOSTIC_OPERATIONS, type DiagnosticOperation } from "@/lib/diagnostics/types";
import { supportReferenceSuffix } from "@/lib/diagnostics/supportReference";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import styles from "./AdminDiagnosticsView.module.scss";

const OPERATION_LABELS: Record<DiagnosticOperation, string> = {
  generate_final: "יצירת שלט (AI)",
  illustration_generate: "יצירת איור",
  cart_add_item: "הוספה לסל",
  cart_convert: "המרת סל להזמנה",
  payment_init: "פתיחת תשלום",
};

type AdminDiagnosticsViewProps = {
  items: AdminOperationFailureRow[];
  operationFilter: DiagnosticOperation | "all";
  traceSearch: string | null;
};

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AdminDiagnosticsView({
  items,
  operationFilter,
  traceSearch,
}: AdminDiagnosticsViewProps) {
  const router = useRouter();

  const onFilterSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const operation = (form.elements.namedItem("operation") as HTMLSelectElement)
        .value;
      const trace = (form.elements.namedItem("trace") as HTMLInputElement).value.trim();
      const params = new URLSearchParams();
      if (operation && operation !== "all") {
        params.set("operation", operation);
      }
      if (trace) {
        params.set("trace", trace);
      }
      const qs = params.toString();
      router.push(qs ? `/admin/diagnostics?${qs}` : "/admin/diagnostics");
    },
    [router],
  );

  return (
    <>
      <form className={styles.filters} onSubmit={onFilterSubmit}>
        <label className={styles.filterField}>
          <span className={styles.filterLabel}>פעולה</span>
          <select
            name="operation"
            className={styles.select}
            defaultValue={operationFilter}
          >
            <option value="all">הכל</option>
            {DIAGNOSTIC_OPERATIONS.map((op) => (
              <option key={op} value={op}>
                {OPERATION_LABELS[op]}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.filterField}>
          <span className={styles.filterLabel}>קוד תמיכה / traceId</span>
          <input
            name="trace"
            type="search"
            className={styles.input}
            placeholder="8 תווים אחרונים או UUID מלא"
            defaultValue={traceSearch ?? ""}
            dir="ltr"
          />
        </label>
        <button type="submit" className={styles.filterBtn}>
          סינון
        </button>
        <Link href="/admin/diagnostics" className={styles.resetLink}>
          נקה
        </Link>
      </form>

      {items.length === 0 ? (
        <div className={styles.empty} role="status">
          <p>לא נמצאו תקלות רשומות בטווח האחרון.</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">זמן</th>
                <th scope="col">פעולה</th>
                <th scope="col">שלב</th>
                <th scope="col">קוד</th>
                <th scope="col">HTTP</th>
                <th scope="col">משך</th>
                <th scope="col">traceId</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={`${row.traceId}-${row.createdAt}`}>
                  <td>{formatWhen(row.createdAt)}</td>
                  <td>{OPERATION_LABELS[row.operation] ?? row.operation}</td>
                  <td>
                    {row.stage}
                    {row.source === "client" ? " (לקוח)" : ""}
                  </td>
                  <td>
                    <code className={styles.code}>{row.errorCode}</code>
                  </td>
                  <td>{row.httpStatus}</td>
                  <td>{row.durationMs}ms</td>
                  <td className={styles.traceCell}>
                    <code className={styles.code} dir="ltr">
                      {supportReferenceSuffix(row.traceId) ?? "—"}
                    </code>
                    <span className={styles.traceFull} title={row.traceId}>
                      {row.traceId}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
