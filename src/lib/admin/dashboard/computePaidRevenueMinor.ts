/**
 * Sum paid-order revenue from frozen commercial snapshots only.
 */
export function computePaidRevenueMinorFromAggregation(
  revenueFacet: Array<{ _id: null; sum: number }> | undefined,
): number {
  const row = revenueFacet?.[0];
  if (!row || !Number.isFinite(row.sum)) {
    return 0;
  }
  const sum = Math.trunc(row.sum);
  return sum >= 0 ? sum : 0;
}
