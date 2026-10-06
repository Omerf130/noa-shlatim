export type PayPlusConfig = {
  apiKey: string;
  secretKey: string;
  paymentPageUid: string;
  apiBaseUrl: string;
  siteUrl: string;
};

function trimEnv(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t ? t : undefined;
}

function normalizeApiBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "");
}

function normalizeSiteUrl(raw: string): string {
  return raw.replace(/\/+$/, "");
}

export function getPayPlusConfig(): PayPlusConfig | null {
  const apiKey = trimEnv(process.env.PAYPLUS_API_KEY);
  const secretKey = trimEnv(process.env.PAYPLUS_SECRET_KEY);
  const paymentPageUid = trimEnv(process.env.PAYPLUS_PAYMENT_PAGE_UID);
  const apiBaseUrl = trimEnv(process.env.PAYPLUS_API_URL);
  const siteUrl = trimEnv(process.env.SITE_URL);

  if (!apiKey || !secretKey || !paymentPageUid || !apiBaseUrl || !siteUrl) {
    return null;
  }

  return {
    apiKey,
    secretKey,
    paymentPageUid,
    apiBaseUrl: normalizeApiBaseUrl(apiBaseUrl),
    siteUrl: normalizeSiteUrl(siteUrl),
  };
}

export function isPayPlusConfigured(): boolean {
  return getPayPlusConfig() !== null;
}
