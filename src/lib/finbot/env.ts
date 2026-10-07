export type FinbotConfig = {
  apiSecret: string;
  apiBaseUrl: string;
};

function trimEnv(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t ? t : undefined;
}

const DEFAULT_FINBOT_API_BASE_URL = "https://api.finbotai.co.il";

export function getFinbotConfig(): FinbotConfig | null {
  const apiSecret = trimEnv(process.env.FINBOT_API_SECRET);
  if (!apiSecret) {
    return null;
  }

  const apiBaseUrl =
    trimEnv(process.env.FINBOT_API_BASE_URL)?.replace(/\/+$/, "") ??
    DEFAULT_FINBOT_API_BASE_URL;

  return { apiSecret, apiBaseUrl };
}

export function isFinbotConfigured(): boolean {
  return getFinbotConfig() !== null;
}
