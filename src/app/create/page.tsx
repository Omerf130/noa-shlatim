import { SignBuilder } from "@/components/builder/SignBuilder/SignBuilder";
import { loadCustomerMaterialAvailability } from "@/lib/store/loadCustomerMaterialAvailability";

export const metadata = {
  title: "מתחילים לעצב | נועה",
  description: "עיצוב שלט דלת מותאם אישית — העלאת תמונה, בחירת רקע וטקסט.",
};

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const materialAvailability = await loadCustomerMaterialAvailability();
  return <SignBuilder materialAvailability={materialAvailability} />;
}
