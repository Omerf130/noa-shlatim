"use server";

import { issueFinbotIncomeForOrder } from "@/lib/finbot/issueFinbotIncomeForOrder";
import { requireAdminSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export type RetryAccountingDocumentState = {
  ok: boolean;
  message?: string;
};

export async function retryFinbotAccountingDocument(
  orderId: string,
): Promise<RetryAccountingDocumentState> {
  await requireAdminSession();

  const trimmed = orderId.trim();
  if (!trimmed) {
    return { ok: false, message: "מזהה הזמנה לא תקין." };
  }

  const result = await issueFinbotIncomeForOrder({ orderId: trimmed });
  revalidatePath(`/admin/orders/${trimmed}`);

  if (!result.ok) {
    return { ok: false, message: "לא ניתן להפעיל הפקה מחדש." };
  }

  if (result.outcome === "issued") {
    return { ok: true, message: "המסמך הופק בהצלחה." };
  }
  if (result.outcome === "failed") {
    return { ok: false, message: "ההפקה נכשלה. בדקו את פרטי השגיאה." };
  }
  if (result.outcome === "uncertain") {
    return {
      ok: false,
      message: "התוצאה לא ברורה. יש לאמת ב-Finbot לפני ניסיון נוסף.",
    };
  }

  return { ok: false, message: "לא ניתן להפיק כעת (ייתכן שהמסמך כבר בהפקה או הופק)." };
}
