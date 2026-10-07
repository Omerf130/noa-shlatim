import { CheckoutPageContent } from "@/components/checkout/CheckoutPageContent";
import { PromotionBannerServer } from "@/components/promotions/PromotionBannerServer";
import { authorizeCheckoutAccess } from "@/lib/checkout/authorizeCheckoutAccess";
import { buildCheckoutPageFromOrder } from "@/lib/checkout/buildCheckoutPageFromOrder";
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
    const auth = await authorizeCheckoutAccess(orderId);
    dto = await buildCheckoutPageFromOrder({
      orderId,
      order: {
        ...auth.checkoutSource,
        commercialSnapshot: undefined,
        status: auth.order.status,
      },
    });
  } catch {
    notFound();
  }

  return (
    <>
      <PromotionBannerServer />
      <CheckoutPageContent dto={dto!} />
    </>
  );
}
