import { addDays, fromIsoDate, toIsoDate, type IsoDate } from "#quno-internal/shared/dateRangeModel";

export function includedDate({
  date,
  excludedWeekdays
}: {
  date: IsoDate;
  excludedWeekdays: readonly number[];
}): IsoDate | null {
  for (let offset = 0; offset < 7; offset++) {
    const candidate = addDays({ date, amount: offset });
    if (!excludedWeekdays.includes(fromIsoDate({ value: candidate }).getUTCDay())) return candidate;
  }
  return null;
}

function offsetMonth({ date, amount }: { date: IsoDate; amount: number }): IsoDate {
  const value = fromIsoDate({ value: date });
  const day = value.getUTCDate();
  value.setUTCDate(1);
  value.setUTCMonth(value.getUTCMonth() + amount + 1);
  value.setUTCDate(0);
  value.setUTCDate(Math.min(day, value.getUTCDate()));
  return toIsoDate({ date: value });
}

/** Date-only arithmetic is independent of local DST and event timestamp interpretation. */
export function dateWindow({
  anchor,
  excludedWeekdays
}: {
  anchor: IsoDate;
  excludedWeekdays: readonly number[];
}): readonly IsoDate[] {
  const normalized = includedDate({ date: anchor, excludedWeekdays });
  if (!normalized) return [];
  const first = includedDate({ date: offsetMonth({ date: normalized, amount: -1 }), excludedWeekdays })!;
  const last = includedDate({ date: offsetMonth({ date: normalized, amount: 1 }), excludedWeekdays })!;
  const dates: IsoDate[] = [];
  for (let date = first; date <= last; date = addDays({ date, amount: 1 })) {
    if (!excludedWeekdays.includes(fromIsoDate({ value: date }).getUTCDay())) dates.push(date);
  }
  return dates;
}
