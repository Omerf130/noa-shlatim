/** Encode public folder filenames for Next/Image and img src. */
export function publicAssetPath(relativePath: string): string {
  return `/${relativePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}
