import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { resolve } from "node:path";
import { assertBlobConfiguredForLocal } from "../src/lib/storage/env";
import {
  deletePrivateBlob,
  putPrivateBlob,
  readPrivateBlobUtf8,
} from "../src/lib/storage/privateBlob";

config({ path: resolve(process.cwd(), ".env.local") });

const EXPECTED = "blob-verify-ok";

async function main(): Promise<void> {
  assertBlobConfiguredForLocal();

  const pathname = `_dev/blob-verify/${randomUUID()}.txt`;
  let uploadedPathname: string | null = null;

  try {
    const stored = await putPrivateBlob(pathname, EXPECTED, {
      contentType: "text/plain; charset=utf-8",
    });
    uploadedPathname = stored.pathname;

    const text = await readPrivateBlobUtf8(stored.pathname);
    if (text !== EXPECTED) {
      throw new Error("Read content did not match uploaded payload.");
    }

    await deletePrivateBlob(stored.pathname);
    uploadedPathname = null;

    const gone = await readPrivateBlobUtf8(stored.pathname);
    if (gone !== null) {
      throw new Error("Blob still readable after delete.");
    }

    console.log("Blob verification succeeded (upload, read, delete).");
    process.exit(0);
  } finally {
    if (uploadedPathname) {
      try {
        await deletePrivateBlob(uploadedPathname);
        console.log("Cleanup: deleted test blob after failure.");
      } catch {
        console.error(
          "Cleanup failed: test blob may remain in the store (check Vercel Blob).",
        );
      }
    }
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : "Unknown error";
  console.error("Blob verification failed:", message);
  process.exit(1);
});
