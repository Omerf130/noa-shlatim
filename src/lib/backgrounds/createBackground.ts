import { randomUUID } from "node:crypto";
import { backgroundImageApiPath } from "@/lib/backgrounds/backgroundCatalog";
import { loadAllBackgroundsForAdmin } from "@/lib/backgrounds/loadBackgrounds";
import { validateImageBuffer } from "@/lib/ai/validateUpload";
import { getOpenAiImageConfig } from "@/lib/openai/config";
import { connectDb } from "@/lib/db/connect";
import { putPrivateBlob } from "@/lib/storage/privateBlob";
import { Background } from "@/models/Background";

export type CreateBackgroundResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

function slugBaseFromDisplayName(name: string): string {
  const trimmed = name.trim().toLowerCase();
  const slug = trimmed
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  return slug || "background";
}

async function allocateBackgroundId(displayName: string): Promise<string> {
  const base = slugBaseFromDisplayName(displayName);
  for (let attempt = 0; attempt < 8; attempt++) {
    const suffix = attempt === 0 ? "" : `-${randomUUID().slice(0, 6)}`;
    const id = `bg-${base}${suffix}`.slice(0, 48);
    const exists = await Background.findOne({ id }).lean();
    if (!exists) {
      return id;
    }
  }
  return `bg-${randomUUID().slice(0, 12)}`;
}

export async function createBackgroundFromUpload(params: {
  displayName: string;
  fileBuffer: Buffer;
}): Promise<CreateBackgroundResult> {
  const displayName = params.displayName.trim();
  if (!displayName) {
    return { ok: false, message: "נא להזין שם רקע." };
  }

  const maxBytes = getOpenAiImageConfig().maxUploadBytes;
  let mime: string;
  let ext: string;
  try {
    const validated = await validateImageBuffer(params.fileBuffer, maxBytes);
    mime = validated.mime;
    ext = validated.ext;
  } catch {
    return { ok: false, message: "קובץ התמונה אינו תקין או גדול מדי." };
  }

  await connectDb();
  const id = await allocateBackgroundId(displayName);
  const pathname = `catalog/backgrounds/${id}.${ext}`;

  await putPrivateBlob(pathname, params.fileBuffer, { contentType: mime });

  const existing = await loadAllBackgroundsForAdmin();
  const maxSort = existing.reduce((max, row) => Math.max(max, row.sortOrder), 0);

  await Background.create({
    id,
    displayName,
    enabled: true,
    sortOrder: maxSort + 1,
    imageSrc: backgroundImageApiPath(id),
    storageKind: "blob",
    blobPathname: pathname,
    objectPosition: "50% 50%",
    alt: `רקע שלט — ${displayName}`,
  });

  return { ok: true, id };
}
