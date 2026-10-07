import type { CartDetailDto } from "@/lib/cart/cartDetailDto";

export const CART_MUTATION_ERROR_MESSAGE =
  "לא הצלחנו לעדכן את הסל. בדקו חיבור ונסו שוב.";

export async function fetchCartDetail(): Promise<CartDetailDto> {
  const res = await fetch("/api/cart", { credentials: "same-origin" });
  if (!res.ok) {
    throw new Error("fetch failed");
  }
  return (await res.json()) as CartDetailDto;
}

export async function patchCartLineQuantity(
  lineId: string,
  quantity: number,
): Promise<CartDetailDto> {
  const res = await fetch(`/api/cart/items/${encodeURIComponent(lineId)}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity }),
  });
  const data = (await res.json()) as CartDetailDto | { ok: false; message: string };
  if (!res.ok || !("lines" in data)) {
    throw new Error(
      "ok" in data && data.ok === false && data.message
        ? data.message
        : CART_MUTATION_ERROR_MESSAGE,
    );
  }
  return data;
}

export async function deleteCartLine(lineId: string): Promise<CartDetailDto> {
  const res = await fetch(`/api/cart/items/${encodeURIComponent(lineId)}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  const data = (await res.json()) as CartDetailDto | { ok: false; message: string };
  if (!res.ok || !("lines" in data)) {
    throw new Error(
      "ok" in data && data.ok === false && data.message
        ? data.message
        : CART_MUTATION_ERROR_MESSAGE,
    );
  }
  return data;
}
