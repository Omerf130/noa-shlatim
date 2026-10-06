export const ISRAEL_TZ = "Asia/Jerusalem";

export type IsraelMonthRangeUtc = {
  startInclusive: Date;
  endExclusive: Date;
};

type IsraelParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function readIsraelParts(date: Date): IsraelParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ISRAEL_TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? Number.NaN);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

/** UTC instant for a wall-clock time in Asia/Jerusalem (minute precision). */
export function israelWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const guess = Date.UTC(year, month - 1, day, hour - 2, minute, 0);
  for (let offsetHours = -18; offsetHours <= 18; offsetHours += 1) {
    for (let offsetMinutes = 0; offsetMinutes < 60; offsetMinutes += 15) {
      const candidate = guess + offsetHours * 3600000 + offsetMinutes * 60000;
      const p = readIsraelParts(new Date(candidate));
      if (
        p.year === year &&
        p.month === month &&
        p.day === day &&
        p.hour === hour &&
        p.minute === minute
      ) {
        return new Date(candidate);
      }
    }
  }
  return new Date(guess);
}

export function israelMonthRangeUtc(
  reference: Date,
  monthsAgo: 0 | 1,
): IsraelMonthRangeUtc {
  const ref = readIsraelParts(reference);
  let year = ref.year;
  let month = ref.month - monthsAgo;
  while (month < 1) {
    month += 12;
    year -= 1;
  }

  const startInclusive = israelWallTimeToUtc(year, month, 1, 0, 0);

  let endYear = year;
  let endMonth = month + 1;
  if (endMonth > 12) {
    endMonth = 1;
    endYear += 1;
  }
  const endExclusive = israelWallTimeToUtc(endYear, endMonth, 1, 0, 0);

  return { startInclusive, endExclusive };
}
