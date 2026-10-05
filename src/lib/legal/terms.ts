/** Current published Terms version — use at future order submission/payment boundary. */
export const TERMS_VERSION = "2026-10" as const;

export type TermsVersion = typeof TERMS_VERSION;

export const TERMS_PAGE_TITLE =
  "תקנון שימוש ורכישה באתר – נועה שלטים לדלת" as const;

export const TERMS_LAST_UPDATED_LABEL = "עודכן לאחרונה: אוקטובר 2026" as const;

export const TERMS_GENDER_NOTE =
  "האמור בתקנון זה מנוסח בלשון זכר מטעמי נוחות בלבד ומתייחס לכל המגדרים." as const;

export const CHECKOUT_TERMS_REQUIRED_MESSAGE =
  "יש לאשר את התקנון כדי להמשיך" as const;

/** Shape for persisting acceptance at submission/payment (not used on draft save yet). */
export type TermsAcceptanceRecord = {
  termsAccepted: true;
  termsVersion: TermsVersion;
  termsAcceptedAt: string;
};
