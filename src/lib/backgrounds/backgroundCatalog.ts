import type { SignBackground } from "@/types/signBackground";
import type { BackgroundDocument } from "@/models/Background";

export type BackgroundLean = {
  id: string;
  displayName: string;
  enabled: boolean;
  sortOrder: number;
  imageSrc: string;
  storageKind: "public" | "blob";
  blobPathname?: string | null;
  objectPosition?: string | null;
  alt?: string | null;
};

export function backgroundDocToLean(doc: BackgroundDocument): BackgroundLean {
  return {
    id: doc.id,
    displayName: doc.displayName,
    enabled: doc.enabled === true,
    sortOrder: doc.sortOrder ?? 0,
    imageSrc: doc.imageSrc,
    storageKind: doc.storageKind as "public" | "blob",
    blobPathname: doc.blobPathname ?? null,
    objectPosition: doc.objectPosition ?? "50% 50%",
    alt: doc.alt ?? "",
  };
}

export function toSignBackground(row: BackgroundLean): SignBackground {
  return {
    id: row.id,
    name: row.displayName,
    imageSrc: row.imageSrc,
    alt: row.alt?.trim() || row.displayName,
    objectPosition: row.objectPosition ?? "50% 50%",
    sortOrder: row.sortOrder,
    active: row.enabled,
  };
}

export function backgroundImageApiPath(backgroundId: string): string {
  return `/api/backgrounds/${encodeURIComponent(backgroundId)}/image`;
}
