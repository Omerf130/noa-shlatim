/** Central OpenAI image settings — change model/size here only. */
export type OpenAiImageConfig = {
  apiKey: string | undefined;
  enabled: boolean;
  model: string;
  size: string;
  quality: "low" | "medium" | "high" | "auto";
  background: "transparent";
  outputFormat: "png";
  requestTimeoutMs: number;
  maxUploadBytes: number;
  allowMockIllustration: boolean;
};

export function getOpenAiImageConfig(): OpenAiImageConfig {
  const quality = process.env.OPENAI_IMAGE_QUALITY ?? "high";
  const qualityParsed =
    quality === "low" || quality === "medium" || quality === "high" || quality === "auto"
      ? quality
      : "high";

  return {
    apiKey: process.env.OPENAI_API_KEY,
    enabled: process.env.AI_ILLUSTRATION_ENABLED === "true",
    model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2.5-sunburst",
    size: process.env.OPENAI_IMAGE_SIZE ?? "1024x1024",
    quality: qualityParsed,
    background: "transparent",
    outputFormat: "png",
    requestTimeoutMs: Number(process.env.OPENAI_IMAGE_TIMEOUT_MS ?? "120000"),
    maxUploadBytes: Number(process.env.AI_MAX_UPLOAD_BYTES ?? String(10 * 1024 * 1024)),
    allowMockIllustration: process.env.ALLOW_MOCK_ILLUSTRATION === "true",
  };
}

export function isAiIllustrationConfigured(): boolean {
  const c = getOpenAiImageConfig();
  return Boolean(c.apiKey);
}

export function isAiIllustrationOperational(): boolean {
  const c = getOpenAiImageConfig();
  return Boolean(c.apiKey && c.enabled);
}
