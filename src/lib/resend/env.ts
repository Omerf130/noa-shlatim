export type ResendNotificationConfig = {
  apiKey: string;
  ownerEmail: string;
};

function trimEnv(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t ? t : undefined;
}

export function getResendNotificationConfig(): ResendNotificationConfig | null {
  const apiKey = trimEnv(process.env.RESEND_API_KEY);
  const ownerEmail = trimEnv(process.env.ORDER_NOTIFICATION_EMAIL);
  if (!apiKey || !ownerEmail) {
    return null;
  }
  return { apiKey, ownerEmail };
}

export function isResendNotificationConfigured(): boolean {
  return getResendNotificationConfig() !== null;
}
