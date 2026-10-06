import {
  normalizeMaterialAvailability,
  type MaterialAvailability,
} from "@/lib/store/materialAvailability";
import { loadStoreSettingsDocument } from "@/lib/store/loadStoreSettings";

export async function loadCustomerMaterialAvailability(): Promise<MaterialAvailability> {
  const doc = await loadStoreSettingsDocument();
  return normalizeMaterialAvailability(doc?.pricing);
}
