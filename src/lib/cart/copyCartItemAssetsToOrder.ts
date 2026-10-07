import {
  orderItemArtworkPath,
  orderItemOriginalPath,
} from "@/lib/orders/orderItemBlobPaths";
import { copyPrivateBlobPath } from "@/lib/storage/copyPrivateBlob";
import type { CartItemDocument } from "@/models/Cart";
import type { OrderStoredAsset } from "@/models/Order";

function extensionFromPathname(pathname: string): string {
  const base = pathname.split("/").pop() ?? "";
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot >= base.length - 1) {
    return "bin";
  }
  return base.slice(dot + 1);
}

export async function copyCartItemAssetsToOrder(params: {
  cartId: string;
  orderId: string;
  item: CartItemDocument;
}): Promise<{
  originalImage: OrderStoredAsset;
  finalArtwork: OrderStoredAsset;
  copiedPathnames: string[];
}> {
  const { orderId, item } = params;
  void params.cartId;
  const lineId = item.lineId;

  const cartOriginal = item.assets?.originalImage;
  const cartArtwork = item.assets?.finalArtwork;
  if (!cartOriginal?.pathname || !cartArtwork?.pathname) {
    throw new Error("Cart item assets missing");
  }

  const ext = extensionFromPathname(cartOriginal.pathname);
  const destOriginal = orderItemOriginalPath(orderId, lineId, ext);
  const destArtwork = orderItemArtworkPath(orderId, lineId);

  const copiedPathnames: string[] = [];

  const originalCopied = await copyPrivateBlobPath({
    sourcePathname: cartOriginal.pathname,
    destinationPathname: destOriginal,
    contentTypeFallback: cartOriginal.contentType,
  });
  copiedPathnames.push(originalCopied.pathname);

  const artworkCopied = await copyPrivateBlobPath({
    sourcePathname: cartArtwork.pathname,
    destinationPathname: destArtwork,
    contentTypeFallback: "image/png",
  });
  copiedPathnames.push(artworkCopied.pathname);

  return {
    originalImage: {
      pathname: originalCopied.pathname,
      contentType: originalCopied.contentType,
      sizeBytes: originalCopied.sizeBytes,
    },
    finalArtwork: {
      pathname: artworkCopied.pathname,
      contentType: artworkCopied.contentType,
      sizeBytes: artworkCopied.sizeBytes,
    },
    copiedPathnames,
  };
}
