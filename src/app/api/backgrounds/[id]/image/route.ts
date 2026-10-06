import { loadBackgroundForRender } from "@/lib/backgrounds/loadBackgrounds";
import { readBackgroundImageBuffer } from "@/lib/backgrounds/readBackgroundImageBuffer";
import { getOpenAiImageConfig } from "@/lib/openai/config";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = decodeURIComponent(rawId).trim();
  if (!id) {
    return new NextResponse(null, { status: 404 });
  }

  const background = await loadBackgroundForRender(id);
  if (!background) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const maxBytes = getOpenAiImageConfig().maxUploadBytes;
    const { buffer, mime } = await readBackgroundImageBuffer(background, maxBytes);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": mime,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
