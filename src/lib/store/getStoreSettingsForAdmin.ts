import { buildAdminStoreSettingsDto } from "@/lib/store/adminStoreSettingsDto";
import { loadStoreSettingsDocument } from "@/lib/store/loadStoreSettings";

export async function getStoreSettingsForAdmin() {
  const doc = await loadStoreSettingsDocument();
  return buildAdminStoreSettingsDto(doc);
}
