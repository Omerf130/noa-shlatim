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

export function listPurchasableMaterials(
  availability: MaterialAvailability,
  magnetPurchasable: boolean,
): Material[] {
  return ORDER.filter((key) => {
    if (key === "wood") {
      return availability.woodEnabled;
    }
    return availability.magnetEnabled && magnetPurchasable;
  });
}

export function isMaterialSelectionValid(
  material: Material | null,
  availability: MaterialAvailability,
  magnetPurchasable: boolean,
): boolean {
  if (!material) {
    return false;
  }
  return listPurchasableMaterials(availability, magnetPurchasable).includes(material);
}

export function resolveSyncedMaterialSelection(
  current: Material | null,
  availability: MaterialAvailability,
  magnetPurchasable: boolean,
): Material | null {
  const enabled = listPurchasableMaterials(availability, magnetPurchasable);
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
