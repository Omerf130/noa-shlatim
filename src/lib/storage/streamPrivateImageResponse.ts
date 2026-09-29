import type { PrivateBlobReadResult } from "@/lib/storage/privateBlob";

export function streamPrivateImageResponse(
  blob: PrivateBlobReadResult,
  fallbackContentType = "image/png",
): Response {
  return new Response(blob.stream, {
    status: 200,
    headers: {
      "Content-Type": blob.contentType || fallbackContentType,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
