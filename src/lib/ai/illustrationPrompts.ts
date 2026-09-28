/** Server-only style IDs — must match client allowlist. */
export const SERVER_STYLE_IDS = [
  "style-soft",
  "style-playful",
  "style-classic",
] as const;

export type ServerStyleId = (typeof SERVER_STYLE_IDS)[number];

const SHARED_RULES = `
You receive TWO input images for images.edit.

IMAGE 1 — Customer reference photo:
Use ONLY to preserve who appears in the illustration: the exact number of people and pets, recognizable faces, hairstyles, important clothing/features, and relationships.
Do NOT add, remove, or replace subjects. Do NOT change ages significantly.

IMAGE 2 — Selected sign background (ART DIRECTION / CONTEXT ONLY):
Use ONLY to understand palette, lighting, mood, visual softness/contrast, scene direction, composition, and how subjects should visually terminate near the lower body (natural, intentional finish — not a harsh rectangular crop).
Do NOT copy, paint, or include any pixels from this background in the output.

CRITICAL OUTPUT RULES:
Return ONLY the illustrated people/pets derived from IMAGE 1.
Output a standalone transparent PNG with genuine alpha (no opaque matte).
Do NOT include: background scenery, beach, sand, plants, furniture, sky, architecture, water, room, frames, signs, or ANY generated text.
Do NOT paint environmental overlap onto the subjects (no sand on legs, no plants on feet, no ground plane from IMAGE 2 baked into the subjects).
Do NOT reproduce the rectangular photo, borders, or original photo background from IMAGE 1.
The asset will be composited over IMAGE 2 by our application — it must remain a separate movable layer.
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
