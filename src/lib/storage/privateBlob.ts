import { del, get, put } from "@vercel/blob";

/** Body types accepted by `put()` — see @vercel/blob SDK. */
export type PutPrivateBlobBody =
  | string
  | Buffer
  | Blob
  | ArrayBuffer
  | ReadableStream
  | File;

const PRIVATE_ACCESS = { access: "private" as const };

/** Safe metadata returned to server callers — never includes tokens. */
export type StoredPrivateBlob = {
  pathname: string;
  url: string;
  contentType: string;
};

export type PrivateBlobReadResult = {
  contentType: string;
  stream: ReadableStream<Uint8Array>;
};

/**
 * Upload bytes to the private Blob store. Server-only.
 */
export async function putPrivateBlob(
  pathname: string,
  body: PutPrivateBlobBody,
  options?: { contentType?: string },
): Promise<StoredPrivateBlob> {
  const result = await put(pathname, body, {
    ...PRIVATE_ACCESS,
    addRandomSuffix: false,
    contentType: options?.contentType,
  });

  return {
    pathname: result.pathname,
    url: result.url,
    contentType: result.contentType,
  };
}

/**
 * Read a private blob by pathname or store URL. Returns null if missing or 304.
 */
export async function getPrivateBlob(
  pathnameOrUrl: string,
): Promise<PrivateBlobReadResult | null> {
  const result = await get(pathnameOrUrl, PRIVATE_ACCESS);

  if (!result || result.statusCode !== 200 || !result.stream) {
    return null;
  }

  return {
    contentType: result.blob.contentType,
    stream: result.stream,
  };
}

/** Delete a private blob by pathname or store URL. */
export async function deletePrivateBlob(pathnameOrUrl: string): Promise<void> {
  await del(pathnameOrUrl);
}

/** Consume a private blob stream into a UTF-8 string (server-only helper). */
export async function readPrivateBlobUtf8(
  pathnameOrUrl: string,
): Promise<string | null> {
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

  return Buffer.concat(chunks).toString("utf8");
}
