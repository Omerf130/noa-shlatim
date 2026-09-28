import {
  isAllowedStyleId,
  type ServerStyleId,
} from "@/lib/ai/illustrationPrompts";
import type { TextPosition } from "@/types/signDesign";

const SHARED_RULES = `
You receive THREE input images for images.edit.

IMAGE 1 — Customer reference photo (IDENTITY):
Use ONLY to preserve who appears in the finished artwork: the exact number of people and pets, recognizable faces, hairstyles, important clothing/features, and relationships.
Do NOT add, remove, or replace subjects. Do NOT change ages significantly.

IMAGE 2 — Selected sign background (SCENE / WORLD):
Use this as the actual environment and world of the finished artwork. Preserve the recognizable scene identity (same setting, mood, and palette direction as IMAGE 2).

IMAGE 3 — Composition reference (LAYOUT ONLY):
Use ONLY to understand approximate subject position, scale, and grouping on the sign canvas.
Do NOT reproduce the photographic appearance, pixels, or rectangular photo edges from IMAGE 3.
Do NOT treat IMAGE 3 as identity — identity comes from IMAGE 1 only.

OUTPUT — ONE cohesive full-scene illustrated artwork:
Transform the people/pets from IMAGE 1 into the selected illustration style and integrate them naturally into the world of IMAGE 2.

You MAY use coherent scene lighting, shadows, depth, environmental interaction, foreground/background occlusion, natural ground contact, natural lower-body treatment, and palette harmonization.

Preserve the selected scene from IMAGE 2 as much as practical.
Respect the approximate composition suggested by IMAGE 3.

Fill the entire output canvas edge to edge with the illustrated scene (opaque artwork, not a separate cutout layer).

Absolutely NO text, letters, Hebrew, typography, watermarks, generated signs, UI elements, or decorative captions.

Leave reasonable visual breathing room in the area where app-rendered text will be placed (see TEXT PLACEMENT below). Do NOT render a placeholder box, mask, or fake text.

TEXT PLACEMENT (metadata only — do not render text):
The customer will overlay real typography separately. Prefer a visually quieter region (simple sky, sand, water, or soft background) in the band appropriate for:
`.trim();

const TEXT_PLACEMENT_HINT: Record<TextPosition, string> = {
  top: "TOP of the sign — upper area should stay relatively clear of faces and critical detail.",
  center: "CENTER of the sign — central band should stay relatively clear of faces and critical detail.",
  bottom: "BOTTOM of the sign — lower area should stay relatively clear of faces and critical detail.",
};

const STYLE_BLOCKS: Record<ServerStyleId, string> = {
  "style-soft": `
Style: soft digital illustration with gentle shading, clean lines, warm and family-friendly tones — applied to the FULL SCENE including integrated subjects.
`.trim(),
  "style-playful": `
Style: colorful cartoon illustration with clear outlines, expressive but faithful likeness, vibrant but balanced colors — applied to the FULL SCENE including integrated subjects.
`.trim(),
  "style-classic": `
Style: handmade watercolor-inspired illustration with soft edges, subtle paper texture feel, artistic but readable likeness — applied to the FULL SCENE including integrated subjects.
`.trim(),
};

export function buildFinalSignPrompt(
  styleId: ServerStyleId,
  textPosition: TextPosition,
): string {
  const placement = TEXT_PLACEMENT_HINT[textPosition];
  return `${SHARED_RULES}\n${placement}\n\n${STYLE_BLOCKS[styleId]}`;
}

export { isAllowedStyleId };
