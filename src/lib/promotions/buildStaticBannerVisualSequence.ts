/** Presentation-only repeats of the visible promotion cycle (not stored data). */
export const BANNER_STATIC_DESKTOP_CYCLE_REPEATS = 6;
export const BANNER_STATIC_MOBILE_CYCLE_REPEATS = 3;

export function expandStaticBannerVisualSequence(
  baseCycle: string[],
  cycleRepeats: number,
): string[] {
  if (baseCycle.length === 0 || cycleRepeats < 1) {
    return [];
  }

  const repeats = Math.max(1, Math.floor(cycleRepeats));
  const expanded: string[] = [];
  for (let i = 0; i < repeats; i++) {
    expanded.push(...baseCycle);
  }
  return expanded;
}

export function staticBannerAccessibleSummary(baseCycle: string[]): string {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const text of baseCycle) {
    if (!text || seen.has(text)) {
      continue;
    }
    seen.add(text);
    parts.push(text);
  }
  return parts.join(" · ");
}
