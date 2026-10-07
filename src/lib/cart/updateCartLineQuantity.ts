import { connectDb } from "@/lib/db/connect";
import { CartError } from "@/lib/cart/cartErrors";
import { Cart } from "@/models/Cart";

export async function updateCartLineQuantity(params: {
  cartId: string;
  lineId: string;
  quantity: number;
}): Promise<boolean> {
  await connectDb();

  const updated = await Cart.findOneAndUpdate(
    {
      _id: params.cartId,
      status: "active",
      items: { $elemMatch: { lineId: params.lineId } },
    },
    { $set: { "items.$.quantity": params.quantity } },
    { new: true },
  ).lean();

  if (!updated) {
    throw new CartError("CART_LINE_NOT_FOUND", "Line not found", 404);
  }

  return true;
}
