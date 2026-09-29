import { authorizeCheckoutAccess } from "@/lib/checkout/authorizeCheckoutAccess";
import { OrderError, userMessageForOrderCode } from "@/lib/orders/errors";
import { getPrivateBlob } from "@/lib/storage/privateBlob";
import { streamPrivateImageResponse } from "@/lib/storage/streamPrivateImageResponse";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { orderId } = await context.params;

  try {
    const { order } = await authorizeCheckoutAccess(orderId, request);
    const pathname = order.assets?.finalArtwork?.pathname;
    if (!pathname) {
      return new NextResponse(null, { status: 404 });
    }

    const blob = await getPrivateBlob(pathname);
    if (!blob) {
      return new NextResponse(null, { status: 404 });
    }

    return streamPrivateImageResponse(blob, "image/png");
  } catch (err) {
    if (err instanceof OrderError) {
      const status = err.httpStatus === 401 ? 401 : 404;
      return NextResponse.json(
        {
          ok: false,
          code: err.code,
          message: userMessageForOrderCode(err.code),
        },
        { status },
      );
    }
    console.error("[api/orders/artwork]", err);
    return new NextResponse(null, { status: 500 });
  }
}
