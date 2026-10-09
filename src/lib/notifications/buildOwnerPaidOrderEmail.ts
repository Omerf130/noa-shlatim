import {
  formatAdminDateTime,
  formatOrderReference,
  materialLabelFromSnapshot,
} from "@/lib/admin/orders/formatOrderReference";
import { formatMinorToIlsDisplay } from "@/lib/money/ils";
import {
  commercialSnapshotDiscountMinor,
  commercialSnapshotDisplayLines,
  commercialSnapshotPromotionsApplied,
  commercialSnapshotShipping,
  commercialSnapshotTotalMinor,
  parseOrderCommercialSnapshot,
} from "@/lib/orders/commercialSnapshotAccess";
import type { OrderCommercialSnapshot } from "@/lib/orders/commercialSnapshot";
import type { ShippingAddress } from "@/lib/checkout/shippingAddressSchema";
import { formatShippingAddressBlock } from "@/lib/orders/formatShippingAddress";
import {
  OWNER_PAID_ORDER_EMAIL_FROM,
  OWNER_PAID_ORDER_EMAIL_SUBJECT,
} from "@/lib/orders/ownerPaidNotification";

export type OwnerPaidOrderEmailContent = {
  from: string;
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatLineRowsHtml(
  snapshotRaw: unknown,
): { htmlRows: string; textLines: string[] } {
  const parsed = parseOrderCommercialSnapshot(snapshotRaw);
  if (!parsed) {
    return { htmlRows: "", textLines: [] };
  }
  const lines = commercialSnapshotDisplayLines(parsed);
  const htmlRows = lines
    .map((line) => {
      const qty = line.quantity > 1 ? ` × ${line.quantity}` : "";
      return `<tr><td style="padding:0 16px 10px;font-size:14px;"><strong>${escapeHtml(line.description)}</strong>${escapeHtml(qty)} — ${escapeHtml(formatMinorToIlsDisplay(line.lineTotalMinor))}</td></tr>`;
    })
    .join("");
  const textLines = lines.map((line) => {
    const qty = line.quantity > 1 ? ` × ${line.quantity}` : "";
    return `${line.description}${qty}: ${formatMinorToIlsDisplay(line.lineTotalMinor)}`;
  });
  return { htmlRows, textLines };
}

function formatPaidCommercialSummary(parsed: ReturnType<typeof parseOrderCommercialSnapshot>) {
  if (!parsed) {
    return { htmlRows: "", textLines: [] as string[] };
  }
  const productMinor = parsed.snapshot.productAmountMinor;
  const discountMinor = commercialSnapshotDiscountMinor(parsed);
  const shipping = commercialSnapshotShipping(parsed);
  const totalMinor = commercialSnapshotTotalMinor(parsed);
  const promos = commercialSnapshotPromotionsApplied(parsed);

  const htmlRows: string[] = [];
  const textLines: string[] = [];

  htmlRows.push(
    `<tr><td style="padding:0 16px 10px;font-size:14px;"><strong>מוצרים:</strong> ${escapeHtml(formatMinorToIlsDisplay(productMinor))}</td></tr>`,
  );
  textLines.push(`מוצרים: ${formatMinorToIlsDisplay(productMinor)}`);

  for (const promo of promos) {
    const label =
      promo.applicationCount > 1
        ? `${promo.customerLabel} ×${promo.applicationCount}`
        : promo.customerLabel;
    htmlRows.push(
      `<tr><td style="padding:0 16px 10px;font-size:14px;"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(`-${formatMinorToIlsDisplay(promo.savingsMinor)}`)}</td></tr>`,
    );
    textLines.push(`${label}: -${formatMinorToIlsDisplay(promo.savingsMinor)}`);
  }

  if (discountMinor > 0 && promos.length === 0) {
    htmlRows.push(
      `<tr><td style="padding:0 16px 10px;font-size:14px;"><strong>הנחה:</strong> ${escapeHtml(`-${formatMinorToIlsDisplay(discountMinor)}`)}</td></tr>`,
    );
    textLines.push(`הנחה: -${formatMinorToIlsDisplay(discountMinor)}`);
  }

  htmlRows.push(
    `<tr><td style="padding:0 16px 10px;font-size:14px;"><strong>משלוח:</strong> ${escapeHtml(formatMinorToIlsDisplay(shipping.amountMinor))}</td></tr>`,
  );
  textLines.push(`משלוח: ${formatMinorToIlsDisplay(shipping.amountMinor)}`);

  htmlRows.push(
    `<tr><td style="padding:0 16px 10px;font-size:14px;"><strong>סה"כ ששולם:</strong> ${escapeHtml(formatMinorToIlsDisplay(totalMinor))}</td></tr>`,
  );
  textLines.push(`סה"כ ששולם: ${formatMinorToIlsDisplay(totalMinor)}`);

  return { htmlRows: htmlRows.join(""), textLines };
}

export function buildOwnerPaidOrderEmail(params: {
  orderId: string;
  customer: { fullName: string; phone: string; email: string };
  shippingAddress?: ShippingAddress | null;
  snapshot: unknown;
  paymentCompletedAtIso: string;
  adminOrderUrl: string;
}): OwnerPaidOrderEmailContent {
  const parsed = parseOrderCommercialSnapshot(params.snapshot);
  if (!parsed) {
    throw new Error("INVALID_SNAPSHOT");
  }

  const orderReference = formatOrderReference(params.orderId);
  const totalLabel = formatMinorToIlsDisplay(commercialSnapshotTotalMinor(parsed));
  const paidAtLabel = formatAdminDateTime(params.paymentCompletedAtIso);
  const shipping = commercialSnapshotShipping(parsed);

  const materialSummary =
    parsed.version === 1
      ? materialLabelFromSnapshot(parsed.snapshot.material)
      : `${parsed.snapshot.lines.length} פריטים`;

  const lineRows = formatLineRowsHtml(params.snapshot);
  const commercialSummary = formatPaidCommercialSummary(parsed);

  const name = escapeHtml(params.customer.fullName.trim());
  const phone = escapeHtml(params.customer.phone.trim());
  const email = escapeHtml(params.customer.email.trim());
  const adminUrl = escapeHtml(params.adminOrderUrl);

  const shippingBlock = params.shippingAddress
    ? formatShippingAddressBlock(params.shippingAddress)
    : null;
  const shippingHtml = shippingBlock
    ? `<tr><td style="padding:0 16px 14px;font-size:14px;white-space:pre-line;"><strong>כתובת למשלוח:</strong><br />${escapeHtml(shippingBlock)}</td></tr>`
    : `<tr><td style="padding:0 16px 14px;font-size:14px;"><strong>כתובת למשלוח:</strong> לא הוזנה</td></tr>`;
  const shippingText = shippingBlock
    ? `כתובת למשלוח:\n${shippingBlock}`
    : "כתובת למשלוח: לא הוזנה";

  const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(OWNER_PAID_ORDER_EMAIL_SUBJECT)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f4f0;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f7f4f0;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e8e0d8;overflow:hidden;">
          <tr>
            <td style="padding:20px 24px;background:#5c4a3d;color:#ffffff;font-size:18px;font-weight:bold;">
              נועה | שלטים לדלת
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 8px;font-size:22px;font-weight:bold;line-height:1.4;">
              התקבלה הזמנה חדשה 🎉
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 20px;font-size:15px;line-height:1.6;color:#444;">
              התקבלה הזמנה חדשה ושולמה בהצלחה באתר.
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf8f6;border:1px solid #ece6df;border-radius:10px;">
                <tr><td style="padding:14px 16px;font-size:14px;"><strong>מספר הזמנה:</strong> ${escapeHtml(orderReference)}</td></tr>
                <tr><td style="padding:0 16px 14px;font-size:14px;"><strong>לקוח:</strong> ${name}</td></tr>
                <tr><td style="padding:0 16px 14px;font-size:14px;"><strong>טלפון:</strong> <span dir="ltr">${phone}</span></td></tr>
                <tr><td style="padding:0 16px 14px;font-size:14px;"><strong>אימייל:</strong> <span dir="ltr">${email}</span></td></tr>
                ${shippingHtml}
                <tr><td style="padding:0 16px 10px;font-size:14px;"><strong>פריטים:</strong></td></tr>
                ${lineRows.htmlRows}
                <tr><td style="padding:0 16px 10px;font-size:14px;"><strong>סיכום מחיר:</strong></td></tr>
                ${commercialSummary.htmlRows}
                <tr><td style="padding:0 16px 14px;font-size:14px;"><strong>סכום ששולם:</strong> ${escapeHtml(totalLabel)}</td></tr>
                <tr><td style="padding:0 16px 14px;font-size:14px;"><strong>סיכום:</strong> ${escapeHtml(materialSummary)}</td></tr>
                <tr><td style="padding:0 16px 14px;font-size:14px;"><strong>משלוח:</strong> ${escapeHtml(shipping.label)} (${escapeHtml(formatMinorToIlsDisplay(shipping.amountMinor))})</td></tr>
                <tr><td style="padding:0 16px 16px;font-size:14px;"><strong>תאריך תשלום:</strong> ${escapeHtml(paidAtLabel)}</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 28px;" align="center">
              <a href="${adminUrl}" style="display:inline-block;background:#5c4a3d;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 24px;border-radius:8px;">
                צפייה בהזמנה
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 24px;font-size:12px;color:#777;border-top:1px solid #ece6df;">
              הודעה אוטומטית מאתר נועה | שלטים לדלת
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    "נועה | שלטים לדלת",
    "",
    "התקבלה הזמנה חדשה 🎉",
    "",
    `מספר הזמנה: ${orderReference}`,
    `לקוח: ${params.customer.fullName.trim()}`,
    `טלפון: ${params.customer.phone.trim()}`,
    `אימייל: ${params.customer.email.trim()}`,
    "",
    shippingText,
    "",
    "פריטים:",
    ...lineRows.textLines,
    "",
    "סיכום מחיר:",
    ...commercialSummary.textLines,
    "",
    `סכום ששולם: ${totalLabel}`,
    `משלוח: ${shipping.label} (${formatMinorToIlsDisplay(shipping.amountMinor)})`,
    `תאריך תשלום: ${paidAtLabel}`,
    "",
    `צפייה בהזמנה: ${params.adminOrderUrl}`,
  ].join("\n");

  return {
    from: OWNER_PAID_ORDER_EMAIL_FROM,
    subject: OWNER_PAID_ORDER_EMAIL_SUBJECT,
    html,
    text,
  };
}

/** @deprecated tests may import v1 snapshot type */
export type { OrderCommercialSnapshot };
