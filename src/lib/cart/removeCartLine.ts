import { connectDb } from "@/lib/db/connect";
import { CartError } from "@/lib/cart/cartErrors";
import { deletePrivateBlobPaths } from "@/lib/storage/privateBlob";
import { Cart, type CartItemDocument } from "@/models/Cart";

export function cartLineBlobPathnames(item: CartItemDocument): string[] {
  const paths: string[] = [];
  const original = item.assets?.originalImage?.pathname;
  const artwork = item.assets?.finalArtwork?.pathname;
  if (original) paths.push(original);
  if (artwork) paths.push(artwork);
  return paths;
}

export async function removeCartLine(params: {
  cartId: string;
  lineId: string;
}): Promise<void> {
  await connectDb();

  const cart = await Cart.findOne({
    _id: params.cartId,
    status: "active",
  }).lean();

  if (!cart) {
    throw new CartError("CART_NOT_ACTIVE", "Cart not active", 409);
  }

  const item = cart.items?.find(
    (row: { lineId: string }) => row.lineId === params.lineId,
  );
  if (!item) {
    throw new CartError("CART_LINE_NOT_FOUND", "Line not found", 404);
  }

  const paths = cartLineBlobPathnames(item as CartItemDocument);

  const pulled = await Cart.findOneAndUpdate(
    { _id: params.cartId, status: "active" },
    { $pull: { items: { lineId: params.lineId } } },
    { new: true },
  ).lean();

  if (!pulled) {
    throw new CartError("CART_NOT_ACTIVE", "Cart not active", 409);
  }

  if (paths.length > 0) {
    await deletePrivateBlobPaths(paths);
  }
}
