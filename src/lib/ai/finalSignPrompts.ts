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

const EXISTING_ILLUSTRATION_RULES = `
You receive THREE input images for images.edit.

IMAGE 1 — Customer-supplied illustration (ALREADY ILLUSTRATED):
The customer uploaded a finished or semi-finished illustration. Preserve it as faithfully as practical.
Keep the same people and pets, the same count, recognizable faces and features, hairstyles, clothing where practical, and the existing illustration style and character identity.
Do NOT redesign, re-cartoonify, or re-illustrate the characters unless minimal edge integration requires it.
Do NOT add, remove, or replace family members or pets. Do NOT change identities.

If IMAGE 1 has transparency: preserve clean character edges; integrate naturally; avoid white halos; do not invent a rectangular backdrop behind them.

If IMAGE 1 has its own white, colored, or photographic backdrop: treat that backdrop as discardable source material — extract the illustrated subjects and integrate them into IMAGE 2. Do NOT preserve a rectangular pasted-card boundary in the output.

IMAGE 2 — Selected sign background (SCENE / WORLD):
Use as the actual environment and world of the finished artwork. Preserve recognizable scene identity (setting, mood, palette direction).

IMAGE 3 — Composition reference (LAYOUT ONLY):
Use ONLY for approximate subject position, scale, and grouping on the sign canvas.
Do NOT reproduce low-quality pixels from IMAGE 3 as the final subject appearance — identity and detail come from IMAGE 1.

OUTPUT — ONE cohesive full-scene artwork:
Integrate the subjects from IMAGE 1 naturally into the world of IMAGE 2 using coherent lighting, shadows, depth, environmental interaction, foreground/background occlusion, natural ground contact, and palette harmonization where appropriate.

The result must NOT look like a separate rectangular image pasted onto a background.

Fill the entire output canvas edge to edge with opaque artwork (not a separate cutout layer).

Absolutely NO text, letters, Hebrew, typography, watermarks, generated signs, UI elements, or decorative captions.

Leave reasonable visual breathing room where app-rendered text will be placed (see TEXT PLACEMENT below). Do NOT render placeholder text.

TEXT PLACEMENT (metadata only — do not render text):
The customer will overlay real typography separately. Prefer a visually quieter region in the band appropriate for:
`.trim();

export function buildExistingIllustrationFinalSignPrompt(
  textPosition: TextPosition,
): string {
  const placement = TEXT_PLACEMENT_HINT[textPosition];
  return `${EXISTING_ILLUSTRATION_RULES}\n${placement}`;
}

export { isAllowedStyleId };
