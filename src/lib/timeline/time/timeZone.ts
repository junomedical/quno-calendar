import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import { civilDateKey, civilTimestamp, zonedFields as readZonedFields } from "#quno-internal/shared/zonedTime";
import { parseIsoDate } from "#quno-internal/timeline/date/localDate";

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
  return readZonedFields({ date, timeZone });
}

/** Map an absolute instant to the displayed calendar day. */
export function zonedDateKey({ date, timeZone }: { date: Date; timeZone?: string }): IsoDate {
  return civilDateKey(zonedFields({ date, timeZone }));
}

/** Map an absolute instant to its displayed minute of day. */
export function zonedMinute({ date, timeZone }: { date: Date; timeZone?: string }): number {
  const fields = zonedFields({ date, timeZone });
  return fields.hour * 60 + fields.minute;
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
