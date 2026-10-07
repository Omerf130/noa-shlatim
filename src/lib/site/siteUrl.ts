function trimEnv(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t ? t : undefined;
}

export function getSiteUrl(): string | null {
  const siteUrl = trimEnv(process.env.SITE_URL);
  if (!siteUrl) {
    return null;
  }
  return siteUrl.replace(/\/+$/, "");
}

export function adminOrderDetailUrl(orderId: string): string | null {
  const base = getSiteUrl();
  if (!base) {
    return null;
  }
  return `${base}/admin/orders/${orderId}`;
}
