import {
  getOpenAiImageConfig,
  isAiIllustrationConfigured,
  isAiIllustrationOperational,
} from "@/lib/openai/config";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const config = getOpenAiImageConfig();
  return NextResponse.json({
    configured: isAiIllustrationConfigured(),
    enabled: isAiIllustrationOperational(),
    allowMockIllustration: config.allowMockIllustration,
  });
}
