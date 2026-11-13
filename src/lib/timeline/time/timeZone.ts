import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import { parseIsoDate } from "#quno-internal/timeline/date/localDate";

const formatters = new Map<string, Intl.DateTimeFormat>();
const wallInstants = new Map<string, number>();
const DAY = 86_400_000;

/** Read civil fields in the display zone, retaining native local behavior when omitted. */
export function zonedFields({ date, timeZone }: { date: Date; timeZone?: string }) {
  if (!timeZone || !Number.isFinite(date.getTime())) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds()
    };
  }
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      calendar: "iso8601",
      numberingSystem: "latn",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    formatters.set(timeZone, formatter);
  }
  const parts = Object.fromEntries(formatter.formatToParts(date).map(({ type, value }) => [type, Number(value)]));
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second
  };
}

/** Map an absolute instant to the displayed calendar day. */
export function zonedDateKey({ date, timeZone }: { date: Date; timeZone?: string }): IsoDate {
  const fields = zonedFields({ date, timeZone });
  return `${String(fields.year).padStart(4, "0")}-${String(fields.month).padStart(2, "0")}-${String(fields.day).padStart(2, "0")}` as IsoDate;
}

/** Map an absolute instant to its displayed minute of day. */
export function zonedMinute({ date, timeZone }: { date: Date; timeZone?: string }): number {
  const fields = zonedFields({ date, timeZone });
  return fields.hour * 60 + fields.minute;
}

function civilTimestamp(fields: ReturnType<typeof zonedFields>): number {
  const date = new Date(0);
  date.setUTCFullYear(fields.year, fields.month - 1, fields.day);
  date.setUTCHours(fields.hour, fields.minute, fields.second, 0);
  return date.getTime();
}

/** Resolve civil time compatibly: choose the earlier fold and advance through a DST gap. */
export function zonedMinuteDate({
  dateKey,
  minute,
  timeZone
}: {
  dateKey: string;
  minute: number;
  timeZone?: string;
}): Date {
  if (!timeZone) {
    const date = parseIsoDate({ value: dateKey });
    date.setHours(0, minute, 0, 0);
    return date;
  }
  const key = `${timeZone}:${dateKey}:${minute}`;
  const cached = wallInstants.get(key);
  if (cached !== undefined) {
    return new Date(cached);
  }
  const [year, month, day] = dateKey.split("-").map(Number);
  const target = civilTimestamp({ year, month, day, hour: 0, minute: 0, second: 0 }) + minute * 60_000;
  const offsets = new Set<number>();
  // Probe both sides so transitions are resolved independently of the browser zone.
  for (const shift of [-2 * DAY, 0, 2 * DAY]) {
    const date = new Date(target + shift);
    offsets.add(civilTimestamp(zonedFields({ date, timeZone })) + date.getUTCMilliseconds() - date.getTime());
  }
  const candidates = [...offsets].map((offset) => {
    const instant = target - offset;
    const date = new Date(instant);
    return { instant, wall: civilTimestamp(zonedFields({ date, timeZone })) + date.getUTCMilliseconds() };
  });
  const exact = candidates.filter(({ wall }) => wall === target).sort((a, b) => a.instant - b.instant);
  const later = candidates.filter(({ wall }) => wall > target).sort((a, b) => a.wall - b.wall);
  const resolved = (exact[0] ?? later[0])?.instant;
  if (resolved === undefined) {
    throw new RangeError("Unable to resolve calendar time in the display timezone");
  }
  if (wallInstants.size >= 512) {
    wallInstants.clear();
  }
  wallInstants.set(key, resolved);
  return new Date(resolved);
}
