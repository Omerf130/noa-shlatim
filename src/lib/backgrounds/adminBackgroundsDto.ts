import { toSignBackground } from "@/lib/backgrounds/backgroundCatalog";
import { loadAllBackgroundsForAdmin } from "@/lib/backgrounds/loadBackgrounds";

export type AdminBackgroundCardDto = {
  id: string;
  displayName: string;
  imageSrc: string;
  enabled: boolean;
  sortOrder: number;
};

export async function getAdminBackgroundsPageDto(): Promise<AdminBackgroundCardDto[]> {
  const rows = await loadAllBackgroundsForAdmin();
  return rows.map((row) => {
    const sign = toSignBackground(row);
    return {
      id: sign.id,
      displayName: sign.name,
      imageSrc: sign.imageSrc,
      enabled: sign.active,
      sortOrder: sign.sortOrder,
    };
  });
}
