import { releaseSignAssetStagingByToken } from "@/lib/signAssetStaging/createSignAssetStaging";
import { parseSignAssetStagingToken } from "@/lib/signAssetStaging/signAssetStagingToken";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { signAssetStagingToken?: unknown };
    const token = parseSignAssetStagingToken(body.signAssetStagingToken);
    if (!token) {
      return NextResponse.json({ ok: true });
    }
    await releaseSignAssetStagingByToken(token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/signs/release-staging]", err);
    return NextResponse.json({ ok: true });
  }
}
