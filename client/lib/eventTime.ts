export interface ScheduledEvent {
  id: string;
  event: string;
  location: string;
  /** ISO-8601 datetime with timezone offset for main card start */
  mainCardStart: string;
}

export function getEventTimestamp(event: {
  DATE?: string;
  date?: string;
  mainCardStart?: string;
}): number | null {
  if (event.mainCardStart) {
    const ts = Date.parse(event.mainCardStart);
    return Number.isNaN(ts) ? null : ts;
  }

  const dateStr = event.DATE || event.date;
  if (!dateStr) return null;

  const direct = Date.parse(dateStr);
  if (Number.isNaN(direct)) return null;

  // Date-only strings parse to midnight UTC; assume 8 PM US Eastern main card.
  if (!/\d{1,2}:\d{2}/.test(dateStr) && !dateStr.includes("T")) {
    const parts = new Date(dateStr);
    const y = parts.getUTCFullYear();
    const m = parts.getUTCMonth() + 1;
    const d = parts.getUTCDate();
    const eastern = Date.parse(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T20:00:00-04:00`);
    return Number.isNaN(eastern) ? direct : eastern;
  }

  return direct;
}

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function getTimeLeft(targetTs: number, now = Date.now()): TimeLeft {
  const distance = Math.max(0, targetTs - now);
  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((distance % (1000 * 60)) / 1000),
  };
}

export function formatMainCardTime(mainCardStart: string, locale = undefined): string {
  const ts = Date.parse(mainCardStart);
  if (Number.isNaN(ts)) return mainCardStart;
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(ts));
}

export function findNextEventTimestamp(
  events: Array<{ DATE?: string; date?: string; mainCardStart?: string }>,
  now = Date.now(),
): number | null {
  const times = events
    .map((event) => getEventTimestamp(event))
    .filter((ts): ts is number => ts !== null && ts >= now)
    .sort((a, b) => a - b);
  return times[0] ?? null;
}
