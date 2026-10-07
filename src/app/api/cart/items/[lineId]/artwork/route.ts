import { authorizeCartLineArtwork } from "@/lib/cart/authorizeCartLineArtwork";
import { cartErrorResponse, handleCartRouteError } from "@/lib/cart/cartApiResponse";
import { CartError } from "@/lib/cart/cartErrors";
import { getPrivateBlob } from "@/lib/storage/privateBlob";
import { streamPrivateImageResponse } from "@/lib/storage/streamPrivateImageResponse";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ lineId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { lineId } = await context.params;

  try {
    const { artworkPathname } = await authorizeCartLineArtwork(request, lineId);
    const blob = await getPrivateBlob(artworkPathname);
    if (!blob) {
      return new NextResponse(null, { status: 404 });
    }

    return streamPrivateImageResponse(blob, "image/png");
  } catch (err) {
    if (err instanceof CartError) {
      const status = err.httpStatus === 401 ? 401 : 404;
      if (status === 401) {
        return cartErrorResponse(err);
      }
      return new NextResponse(null, { status: 404 });
    }
    console.error("[api/cart/items/artwork]", err);
    return handleCartRouteError(err);
  }
}
