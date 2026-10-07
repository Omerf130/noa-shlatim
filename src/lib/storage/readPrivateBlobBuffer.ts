import { getPrivateBlob } from "@/lib/storage/privateBlob";

export async function readPrivateBlobBuffer(
  pathnameOrUrl: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const read = await getPrivateBlob(pathnameOrUrl);
  if (!read) {
    return null;
  }

  const reader = read.stream.getReader();
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return {
    buffer: Buffer.concat(chunks),
    contentType: read.contentType,
  };
}
