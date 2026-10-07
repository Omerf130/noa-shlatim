export function cartNavAriaLabel(badgeQuantity: number): string {
  if (badgeQuantity > 0) {
    return badgeQuantity === 1
      ? "סל הקניות, פריט אחד"
      : `סל הקניות, ${badgeQuantity} פריטים`;
  }
  return "סל הקניות";
}
