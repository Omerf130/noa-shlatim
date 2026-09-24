/** Dev/QA: trigger browser download of an in-memory blob/object URL (no network). */
export function downloadObjectUrl(objectUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export const QA_AI_ILLUSTRATION_FILENAME = "noa-ai-illustration.png";
