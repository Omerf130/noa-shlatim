import { putPrivateBlob } from "@/lib/storage/privateBlob";
import { readPrivateBlobBuffer } from "@/lib/storage/readPrivateBlobBuffer";

export async function copyPrivateBlobPath(params: {
  sourcePathname: string;
  destinationPathname: string;
  contentTypeFallback?: string;
}): Promise<{ pathname: string; contentType: string; sizeBytes: number }> {
  const source = await readPrivateBlobBuffer(params.sourcePathname);
  if (!source) {
    throw new Error("Source blob missing");
  }

  const contentType = source.contentType || params.contentTypeFallback || "application/octet-stream";
  const stored = await putPrivateBlob(params.destinationPathname, source.buffer, {
    contentType,
  });

  return {
    pathname: stored.pathname,
    contentType,
    sizeBytes: source.buffer.length,
  };
}
