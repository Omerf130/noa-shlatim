import { z } from "zod";
import { isAllowedStyleId } from "@/lib/ai/illustrationPrompts";
import {
  DECORATION_SCALE_MAX,
  DECORATION_SCALE_MIN,
  DECORATION_XY_MAX,
  DECORATION_XY_MIN,
  ILLUSTRATION_XY_MAX,
  ILLUSTRATION_XY_MIN,
  TEXT_OFFSET_MAX,
  TEXT_OFFSET_MIN,
} from "@/lib/sign/compositionBounds";
import { OrderError } from "@/lib/orders/errors";

const decorationTypeIds = [
  "heart",
  "star",
  "paw",
  "leaf",
  "flower",
  "sparkle",
  "house",
  "sun",
] as const;

const textColorSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("solid"),
    hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }),
  z.object({
    kind: z.literal("multicolor"),
    preset: z.enum(["rainbow", "sunset", "ocean", "pastel"]),
  }),
]);

const textDesignSchema = z.object({
  value: z.string().trim().min(1).max(300),
  color: textColorSchema,
  size: z.number().min(8).max(120),
  position: z.enum(["top", "center", "bottom"]),
  fontStyle: z.enum(["clean", "soft", "personal"]),
  offsetX: z.number().min(TEXT_OFFSET_MIN).max(TEXT_OFFSET_MAX),
  offsetY: z.number().min(TEXT_OFFSET_MIN).max(TEXT_OFFSET_MAX),
});

const illustrationTransformSchema = z.object({
  x: z.number().min(ILLUSTRATION_XY_MIN).max(ILLUSTRATION_XY_MAX),
  y: z.number().min(ILLUSTRATION_XY_MIN).max(ILLUSTRATION_XY_MAX),
  scale: z.number().min(0.5).max(1.5),
});

const decorationSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(decorationTypeIds),
  x: z.number().min(DECORATION_XY_MIN).max(DECORATION_XY_MAX),
  y: z.number().min(DECORATION_XY_MIN).max(DECORATION_XY_MAX),
  scale: z.number().min(DECORATION_SCALE_MIN).max(DECORATION_SCALE_MAX),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

const persistedSignDesignBaseSchema = z.object({
  backgroundId: z.string().trim().min(1),
  material: z.enum(["wood", "magnet"]),
  text: textDesignSchema,
  illustrationTransform: illustrationTransformSchema,
  decorations: z.array(decorationSchema).max(24),
});

export const photoOrderDesignSchema = persistedSignDesignBaseSchema.extend({
  creationMode: z.literal("photo"),
  photoIllustrationStyleId: z.string().trim().min(1),
});

export const illustrationOrderDesignSchema = persistedSignDesignBaseSchema.extend({
  creationMode: z.literal("illustration"),
});

export const orderDesignSchema = z.discriminatedUnion("creationMode", [
  photoOrderDesignSchema,
  illustrationOrderDesignSchema,
]);

export type PhotoOrderDesignSnapshot = z.infer<typeof photoOrderDesignSchema>;
export type IllustrationOrderDesignSnapshot = z.infer<
  typeof illustrationOrderDesignSchema
>;
export type OrderDesignSnapshot = z.infer<typeof orderDesignSchema>;

export function parseAndValidateOrderDesign(raw: unknown): OrderDesignSnapshot {
  const parsed = orderDesignSchema.safeParse(raw);
  if (!parsed.success) {
    throw new OrderError("INVALID_DESIGN", "Invalid design snapshot", 400);
  }

  const design = parsed.data;

  if (design.creationMode === "photo") {
    if (!isAllowedStyleId(design.photoIllustrationStyleId)) {
      throw new OrderError("INVALID_DESIGN", "Invalid style", 400);
    }
  }

  return design;
}

export function parseAndValidatePhotoOrderDesign(raw: unknown): PhotoOrderDesignSnapshot {
  const design = parseAndValidateOrderDesign(raw);
  if (design.creationMode !== "photo") {
    throw new OrderError("INVALID_DESIGN", "Invalid design snapshot", 400);
  }
  return design;
}

export const draftIdempotencyKeySchema = z.string().uuid();
