import { orderDesignSchema } from "@/lib/orders/orderDesignSchema";
import type { OrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";

export function parseCartLineDesign(raw: unknown): OrderDesignSnapshot | null {
  const parsed = orderDesignSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
