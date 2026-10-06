import type { MaterialAvailability } from "@/lib/store/materialAvailability";
import type { Material } from "@/types/signDesign";

export const BUILDER_MATERIALS_UNAVAILABLE_MESSAGE =
  "כרגע אין חומרים זמינים להזמנה. ניתן לחזור ולנסות שוב בהמשך.";

const ORDER: Material[] = ["wood", "magnet"];

export function listEnabledMaterials(availability: MaterialAvailability): Material[] {
  return ORDER.filter((key) =>
    key === "wood" ? availability.woodEnabled : availability.magnetEnabled,
  );
}

export function isMaterialSelectionValid(
  material: Material | null,
  availability: MaterialAvailability,
): boolean {
  if (!material) {
    return false;
  }
  return listEnabledMaterials(availability).includes(material);
}

export function resolveSyncedMaterialSelection(
  current: Material | null,
  availability: MaterialAvailability,
): Material | null {
  const enabled = listEnabledMaterials(availability);
  if (enabled.length === 0) {
    return null;
  }
  if (current && enabled.includes(current)) {
    return current;
  }
  if (enabled.length === 1) {
    return enabled[0]!;
  }
  return null;
}
