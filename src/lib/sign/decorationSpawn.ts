import { clampDecorationXY } from "@/lib/sign/compositionBounds";

/** Fixed corners — avoids sign center; cycles with a small cascade. */
const SPAWN_SLOTS = [
  { x: 18, y: 20 },
  { x: 82, y: 20 },
  { x: 18, y: 36 },
  { x: 82, y: 36 },
] as const;

/** Position for the next decoration (existingCount = length before add). */
export function spawnDecorationPosition(existingCount: number): {
  x: number;
  y: number;
} {
  const slot = SPAWN_SLOTS[existingCount % SPAWN_SLOTS.length];
  const cascade = Math.floor(existingCount / SPAWN_SLOTS.length) * 4;
  return clampDecorationXY(slot.x + cascade, slot.y + cascade);
}

/** Offset when duplicating so both copies stay visible. */
export function duplicateDecorationOffset(x: number, y: number): {
  x: number;
  y: number;
} {
  return clampDecorationXY(x + 4, y + 4);
}
