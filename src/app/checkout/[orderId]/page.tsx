import { CheckoutPageContent } from "@/components/checkout/CheckoutPageContent";
import { authorizeCheckoutAccess } from "@/lib/checkout/authorizeCheckoutAccess";
import { buildCheckoutCommercialView } from "@/lib/checkout/buildCheckoutCommercialView";
import {
  buildCheckoutPageDto,
  buildCheckoutPageDtoWithoutDesign,
} from "@/lib/checkout/checkoutPageDto";
import { photoOrderDesignSchema } from "@/lib/orders/orderDesignSchema";
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
    const commercial = await buildCheckoutCommercialView({
      design: order.design,
      savedShippingMethodId: order.checkoutSelection?.shippingMethodId,
    });

    const customer = order.customer
      ? {
          fullName: order.customer.fullName ?? "",
          phone: order.customer.phone ?? "",
          email: order.customer.email ?? "",
        }
      : null;

    const designParsed = photoOrderDesignSchema.safeParse(order.design);
    if (designParsed.success) {
      dto = buildCheckoutPageDto({
        orderId,
        design: designParsed.data,
        customer,
        notes: order.notes,
        commercial,
      });
    } else {
      dto = buildCheckoutPageDtoWithoutDesign({
        orderId,
        customer,
        notes: order.notes,
        commercial,
      });
    }
  } catch {
    notFound();
  }

  return <CheckoutPageContent dto={dto!} />;
}
