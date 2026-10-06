/** Shared Mongo filter for admin-visible customer orders (list, dashboard). */
export const ADMIN_VISIBLE_ORDER_FILTER = {
  creationMode: { $in: ["photo", "illustration"] as const },
  status: { $in: ["creating", "draft", "payment_pending", "paid"] as const },
};
