/** Shared max image upload bytes (matches getOpenAiImageConfig default). */
export function maxImageUploadBytes(): number {
  return Number(process.env.AI_MAX_UPLOAD_BYTES ?? String(10 * 1024 * 1024));
}

/**
 * Server Action body limit must cover the raw multipart request (file + boundaries).
 * Keep in sync with admin/API image validation via maxImageUploadBytes().
 */
export function serverActionBodySizeLimitBytes(): number {
  return maxImageUploadBytes() + 512 * 1024;
}
