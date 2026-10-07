import {
  resolveMagnetSizeCatalog,
  type MagnetSizeCatalogEntry,
  type StoreMagnetPricingInput,
} from "@/lib/store/magnetSizes";

export function findMagnetSizeForDisplay(
  input: StoreMagnetPricingInput,
  magnetSizeId: string | undefined | null,
): Pick<MagnetSizeCatalogEntry, "id" | "name" | "dimensionsLabel"> | null {
  if (!magnetSizeId?.trim()) {
    return null;
  }
  const catalog = resolveMagnetSizeCatalog(input);
  const match = catalog.find((s) => s.id === magnetSizeId.trim());
  if (!match) {
    return null;
  }
  return {
    id: match.id,
    name: match.name?.trim() || "מגנט",
    dimensionsLabel: match.dimensionsLabel?.trim() ?? "",
  };
}
