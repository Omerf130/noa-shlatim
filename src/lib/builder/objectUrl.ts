const ACCEPTED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const MAX_BYTES = 10 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_MIME.has(file.type)) {
    return "נא להעלות קובץ JPG, PNG או WEBP.";
  }
  if (file.size > MAX_BYTES) {
    return "הקובץ גדול מדי. הגודל המקסימלי הוא 10MB.";
  }
  return null;
}

export function createObjectUrl(file: File | Blob): string {
  return URL.createObjectURL(file);
}

export function revokeObjectUrl(url: string | null | undefined): void {
  if (url) URL.revokeObjectURL(url);
}
