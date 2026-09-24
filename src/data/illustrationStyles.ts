/** Mock illustration styles — card art is placeholder; previewFilter is prototype-only. */
export type IllustrationStyleCardVariant = "classic" | "soft" | "playful";

export type IllustrationStyle = {
  id: string;
  name: string;
  cardVariant: IllustrationStyleCardVariant;
  /** CSS class for temporary preview simulation only — not final AI output */
  previewFilter: "mockClassic" | "mockSoft" | "mockPlayful";
};

export const illustrationStyles: IllustrationStyle[] = [
  {
    id: "style-classic",
    name: "קלאסי",
    cardVariant: "classic",
    previewFilter: "mockClassic",
  },
  {
    id: "style-soft",
    name: "רך",
    cardVariant: "soft",
    previewFilter: "mockSoft",
  },
  {
    id: "style-playful",
    name: "שובב",
    cardVariant: "playful",
    previewFilter: "mockPlayful",
  },
];

export function getIllustrationStyleById(id: string | null): IllustrationStyle | undefined {
  if (!id) return undefined;
  return illustrationStyles.find((s) => s.id === id);
}
