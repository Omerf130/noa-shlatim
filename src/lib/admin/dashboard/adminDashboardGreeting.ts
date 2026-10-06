const ISRAEL_TZ = "Asia/Jerusalem";

export type AdminDashboardGreeting = {
  greeting: string;
  dateLabel: string;
};

function hourInIsrael(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ISRAEL_TZ,
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);
  const hour = parts.find((p) => p.type === "hour")?.value;
  return hour ? Number.parseInt(hour, 10) : now.getHours();
}

export function buildAdminDashboardGreeting(now: Date = new Date()): AdminDashboardGreeting {
  const hour = hourInIsrael(now);
  let greeting: string;
  if (hour >= 5 && hour < 12) {
    greeting = "בוקר טוב";
  } else if (hour >= 12 && hour < 17) {
    greeting = "צהריים טובים";
  } else if (hour >= 17 && hour < 21) {
    greeting = "ערב טוב";
  } else {
    greeting = "לילה טוב";
  }

  const dateLabel = new Intl.DateTimeFormat("he-IL", {
    timeZone: ISRAEL_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  return { greeting, dateLabel };
}
