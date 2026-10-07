import type { StoreMagnetSize } from "@/models/StoreSettings";
import type { StoreMaterialPricingLike } from "@/lib/store/materialAvailability";

/** Virtual id when bridging legacy pricing.magnetPriceMinor (never persisted). */
export const LEGACY_MAGNET_SIZE_ID = "legacy-magnet";

export const MAX_MAGNET_SIZES = 20;

export type MagnetSizeCatalogEntry = StoreMagnetSize & {
  isLegacyVirtual?: boolean;
};

export type StoreMagnetPricingInput = StoreMaterialPricingLike & {
  magnetSizes?: StoreMagnetSize[] | null;
};

function isValidPriceMinor(value: number | null | undefined): value is number {
  return value != null && Number.isInteger(value) && value >= 0;
}

export function isMagnetSizeCustomerReady(size: StoreMagnetSize): boolean {
  if (!size.enabled) return false;
  const name = size.name?.trim();
  if (!name) return false;
  return isValidPriceMinor(size.priceMinor);
}

export function hasPersistedMagnetSizes(
  sizes: StoreMagnetSize[] | null | undefined,
): boolean {
  return (sizes?.length ?? 0) > 0;
}

function legacyVirtualSize(priceMinor: number): MagnetSizeCatalogEntry {
  return {
    id: LEGACY_MAGNET_SIZE_ID,
    name: "מגנט",
    dimensionsLabel: "",
    priceMinor,
    enabled: true,
    sortOrder: 0,
    isLegacyVirtual: true,
  };
}

/**
 * Full catalog for server pricing (persisted rows, sorted).
 * When empty, may include one legacy virtual row — not stored in Mongo.
 */
export function resolveMagnetSizeCatalog(
  input: StoreMagnetPricingInput,
): MagnetSizeCatalogEntry[] {
  const persisted = [...(input.magnetSizes ?? [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );

  if (persisted.length > 0) {
    return persisted;
  }

  if (
    input.magnetEnabled !== false &&
    isValidPriceMinor(input.magnetPriceMinor)
  ) {
    return [legacyVirtualSize(input.magnetPriceMinor)];
  }

  return [];
}

/** Enabled sizes shown to customers (includes legacy virtual when active). */
export function listCustomerMagnetSizes(
  input: StoreMagnetPricingInput,
): MagnetSizeCatalogEntry[] {
  return resolveMagnetSizeCatalog(input).filter(isMagnetSizeCustomerReady);
}

export function isLegacyMagnetBridgeActive(
  input: StoreMagnetPricingInput,
): boolean {
  if (hasPersistedMagnetSizes(input.magnetSizes)) {
    return false;
  }
  return (
    input.magnetEnabled !== false &&
    isValidPriceMinor(input.magnetPriceMinor)
  );
}

export function isMagnetPurchasable(input: StoreMagnetPricingInput): boolean {
  if (input.magnetEnabled === false) {
    return false;
  }
  return listCustomerMagnetSizes(input).length > 0;
}

export function findMagnetSizeInCatalog(
  catalog: MagnetSizeCatalogEntry[],
  magnetSizeId: string,
): MagnetSizeCatalogEntry | null {
  const id = magnetSizeId.trim();
  if (!id) return null;
  const match = catalog.find((s) => s.id === id);
  if (!match || !isMagnetSizeCustomerReady(match)) {
    return null;
  }
  return match;
}

export function resolveMagnetSizePriceMinor(
  input: StoreMagnetPricingInput,
  magnetSizeId: string,
): number {
  const catalog = resolveMagnetSizeCatalog(input);
  const size = findMagnetSizeInCatalog(catalog, magnetSizeId);
  if (!size || size.priceMinor == null) {
    throw new MagnetSizeNotAvailableError();
  }
  return size.priceMinor;
}

export class MagnetSizeNotAvailableError extends Error {
  readonly code = "MAGNET_SIZE_UNAVAILABLE" as const;
}
