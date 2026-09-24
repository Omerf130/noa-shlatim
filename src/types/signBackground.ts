export type SignBackground = {
  id: string;
  name: string;
  /** Public URL path, e.g. /backgrounds/file.png (encodeURIComponent on filename). */
  imageSrc: string;
  thumbnailSrc?: string;
  alt: string;
  objectPosition?: string;
  sortOrder: number;
  active: boolean;
};
