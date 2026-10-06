export type KpiTrendVariant = "positive" | "negative" | "neutral";

export type KpiTrendLine = {
  variant: KpiTrendVariant;
  /** Full line when no split display is needed */
  text: string;
  /** e.g. "+12%" — omit for neutral/from-zero copy */
  percentLabel?: string;
  suffix?: string;
  showUpArrow?: boolean;
  showDownArrow?: boolean;
};

const SUFFIX = "מהחודש הקודם";

export function computeMonthOverMonthTrend(
  current: number,
  previous: number,
): KpiTrendLine {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) {
    return { variant: "neutral", text: "אין שינוי מהחודש הקודם" };
  }

  const cur = Math.max(0, Math.trunc(current));
  const prev = Math.max(0, Math.trunc(previous));

  if (prev === 0 && cur === 0) {
    return { variant: "neutral", text: "אין שינוי מהחודש הקודם" };
  }

  if (prev === 0 && cur > 0) {
    return { variant: "positive", text: "עלייה מהחודש הקודם" };
  }

  if (cur === prev) {
    return { variant: "neutral", text: "אין שינוי מהחודש הקודם" };
  }

  const rawPct = ((cur - prev) / prev) * 100;
  const rounded = Math.round(rawPct);

  if (cur > prev) {
    return {
      variant: "positive",
      text: `${rounded > 0 ? "+" : ""}${rounded}% ${SUFFIX}`,
      percentLabel: `+${Math.abs(rounded)}%`,
      suffix: SUFFIX,
      showUpArrow: true,
    };
  }

  return {
    variant: "negative",
    text: `${rounded}% ${SUFFIX}`,
    percentLabel: `${rounded}%`,
    suffix: SUFFIX,
    showDownArrow: true,
  };
}
