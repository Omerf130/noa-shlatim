/** Server-only style IDs — must match client allowlist. */
export const SERVER_STYLE_IDS = [
  "style-soft",
  "style-playful",
  "style-classic",
] as const;

export type ServerStyleId = (typeof SERVER_STYLE_IDS)[number];

const SHARED_RULES = `
Create an illustrated SUBJECT ASSET from the reference photo (people and/or pets).
Preserve the exact number of people and pets, recognizable faces, hairstyles, important clothing, and relationships.
Do NOT add, remove, or replace subjects. Do NOT change ages significantly. Do NOT add unrelated objects or scenery.
Do NOT reproduce the rectangular photo, frame, borders, or original background scene.
Output isolated illustrated subjects on a fully transparent background (alpha).
The result will be composited onto a separate door-sign background by our app — do not include any sign, text, room, or landscape background.
`.trim();

const STYLE_BLOCKS: Record<ServerStyleId, string> = {
  "style-soft": `
Style: soft digital illustration with gentle shading, clean lines, warm and family-friendly tones.
`.trim(),
  "style-playful": `
Style: colorful cartoon illustration with clear outlines, expressive but faithful likeness, vibrant but balanced colors.
`.trim(),
  "style-classic": `
Style: handmade watercolor-inspired illustration with soft edges, subtle paper texture feel, artistic but readable likeness.
`.trim(),
};

export function isAllowedStyleId(id: string): id is ServerStyleId {
  return (SERVER_STYLE_IDS as readonly string[]).includes(id);
}

export function buildIllustrationPrompt(styleId: ServerStyleId): string {
  return `${SHARED_RULES}\n\n${STYLE_BLOCKS[styleId]}`;
}
