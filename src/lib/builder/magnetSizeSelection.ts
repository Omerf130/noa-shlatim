import type { CustomerMagnetSizeDto } from "@/lib/store/loadCustomerMagnetCatalog";

export function isMagnetSizeInCatalog(
  magnetSizeId: string | null,
  sizes: CustomerMagnetSizeDto[],
): boolean {
  if (!magnetSizeId) {
    return false;
  }
  return sizes.some((s) => s.id === magnetSizeId);
}

/** When exactly one size exists, that id; otherwise null until user picks. */
export function defaultMagnetSizeIdForCatalog(
  sizes: CustomerMagnetSizeDto[],
): string | null {
  if (sizes.length === 1) {
    return sizes[0]!.id;
  }
  return null;
}

export function resolveSyncedMagnetSizeId(
  current: string | null,
  material: "wood" | "magnet" | null,
  sizes: CustomerMagnetSizeDto[],
): string | null {
  if (material !== "magnet") {
    return null;
  }
  if (isMagnetSizeInCatalog(current, sizes)) {
    return current;
  }
  return defaultMagnetSizeIdForCatalog(sizes);
}
