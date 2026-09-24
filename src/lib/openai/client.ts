import OpenAI from "openai";
import { getOpenAiImageConfig } from "./config";

let client: OpenAI | null = null;

export function getOpenAiClient(): OpenAI | null {
  const { apiKey } = getOpenAiImageConfig();
  if (!apiKey) return null;
  if (!client) {
    client = new OpenAI({ apiKey, timeout: getOpenAiImageConfig().requestTimeoutMs });
  }
  return client;
}
