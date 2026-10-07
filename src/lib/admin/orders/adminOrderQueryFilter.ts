/** Shared Mongo filter for admin-visible customer orders (list, dashboard). */
export const ADMIN_VISIBLE_ORDER_FILTER = {
  status: { $in: ["creating", "draft", "payment_pending", "paid"] as const },
  $or: [
    { creationMode: { $in: ["photo", "illustration"] as const } },
    { "items.0.lineId": { $exists: true } },
  ],
};
