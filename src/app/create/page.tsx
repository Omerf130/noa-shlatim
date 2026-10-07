import { SignBuilder } from "@/components/builder/SignBuilder/SignBuilder";
import { loadEnabledBackgroundsForCustomer } from "@/lib/backgrounds/loadBackgrounds";
import { loadCustomerMagnetCatalog } from "@/lib/store/loadCustomerMagnetCatalog";
import { loadCustomerMaterialAvailability } from "@/lib/store/loadCustomerMaterialAvailability";

export const metadata = {
  title: "מתחילים לעצב | נועה",
  description: "עיצוב שלט דלת מותאם אישית — העלאת תמונה, בחירת רקע וטקסט.",
};

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const [materialAvailability, customerMagnetCatalog, customerBackgrounds] =
    await Promise.all([
      loadCustomerMaterialAvailability(),
      loadCustomerMagnetCatalog(),
      loadEnabledBackgroundsForCustomer(),
    ]);
  return (
    <SignBuilder
      materialAvailability={materialAvailability}
      customerMagnetCatalog={customerMagnetCatalog}
      customerBackgrounds={customerBackgrounds}
    />
  );
}
