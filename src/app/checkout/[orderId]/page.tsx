import { CheckoutPageContent } from "@/components/checkout/CheckoutPageContent";
import { authorizeCheckoutAccess } from "@/lib/checkout/authorizeCheckoutAccess";
import { buildCheckoutPageDto } from "@/lib/checkout/checkoutPageDto";
import type { PhotoOrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";
import { assertValidOrderId } from "@/lib/orders/orderBlobPaths";
import { redirect, notFound } from "next/navigation";

type CheckoutPageProps = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ access?: string }>;
};

export default async function CheckoutPage({
  params,
  searchParams,
}: CheckoutPageProps) {
  const { orderId } = await params;
  const { access } = await searchParams;

  try {
    assertValidOrderId(orderId);
  } catch {
    notFound();
  }

  if (access?.trim()) {
    const query = new URLSearchParams({
      orderId,
      access: access.trim(),
    });
    redirect(`/api/checkout/access?${query.toString()}`);
  }

  let dto;
  try {
    const { order } = await authorizeCheckoutAccess(orderId);
    const design = order.design as PhotoOrderDesignSnapshot;

    dto = buildCheckoutPageDto({
      orderId,
      design,
      customer: order.customer
        ? {
            fullName: order.customer.fullName ?? "",
            phone: order.customer.phone ?? "",
            email: order.customer.email ?? "",
          }
        : null,
      notes: order.notes,
    });
  } catch {
    notFound();
  }

  return <CheckoutPageContent dto={dto!} />;
}
