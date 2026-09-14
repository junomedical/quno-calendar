import { zonedParts } from "#quno-internal/timeline/time/zonedTime";
import { addCalendarDays, addCalendarMonths, isSameLocalDate, parseIsoDate } from "./localDate";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
/** Formats a Date as the calendar's stable `yyyy-MM-dd` date key. */
export function toDateKey({ date, timeZone }: { date: Date; timeZone?: string }): IsoDate {
  if (timeZone) return zonedParts({ value: date, timeZone: timeZone }).date as IsoDate;
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid time value");
  }
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-") as IsoDate;
}
/** Parses a `yyyy-MM-dd` date key as a local midnight Date. */
export function fromDateKey({ dateKey }: { dateKey: string }): Date {
  return parseIsoDate({ value: dateKey });
}
/** Returns whether the date should be removed from the virtual date sequence. */
export function isWeekdayExcluded({ date, excludedWeekdays }: { date: Date; excludedWeekdays: number[] }): boolean {
  return excludedWeekdays.includes(date.getDay());
}
/** Moves an excluded anchor date forward to the next included date. */
export function normalizeAnchorDate({
  dateKey,
  excludedWeekdays
}: {
  dateKey: string;
  excludedWeekdays: number[];
}): IsoDate {
  let date = fromDateKey({ dateKey });
  for (let guard = 0; guard < 7 && isWeekdayExcluded({ date, excludedWeekdays }); guard += 1) {
    date = addCalendarDays({ date, amount: 1 });
  }
  return toDateKey({ date });
}
/** Returns the included date key at an offset from an anchor date. */
export function dateAtVirtualOffset({
  anchorDateKey,
  offset,
  excludedWeekdays
}: {
  anchorDateKey: string;
  offset: number;
  excludedWeekdays: number[];
}): IsoDate {
  let date = fromDateKey({ dateKey: normalizeAnchorDate({ dateKey: anchorDateKey, excludedWeekdays }) });
  if (offset === 0) {
    return toDateKey({ date });
  }
  const direction = offset > 0 ? 1 : -1;
  let remaining = Math.abs(offset);
  while (remaining > 0) {
    date = addCalendarDays({ date, amount: direction });
    if (!isWeekdayExcluded({ date, excludedWeekdays })) {
      remaining -= 1;
    }
  }
  return toDateKey({ date });
}
/** Returns the included-date offset between an anchor and target date key. */
export function virtualOffsetForDate({
  anchorDateKey,
  targetDateKey,
  excludedWeekdays
}: {
  anchorDateKey: string;
  targetDateKey: string;
  excludedWeekdays: number[];
}): number {
  const anchor = fromDateKey({ dateKey: normalizeAnchorDate({ dateKey: anchorDateKey, excludedWeekdays }) });
  const target = fromDateKey({ dateKey: targetDateKey });
  if (isSameLocalDate({ left: anchor, right: target })) {
    return 0;
  }
  const direction = target > anchor ? 1 : -1;
  let date = anchor;
  let offset = 0;
  while (!isSameLocalDate({ left: date, right: target })) {
    date = addCalendarDays({ date, amount: direction });
    if (!isWeekdayExcluded({ date, excludedWeekdays })) {
      offset += direction;
    }
  }
  return offset;
}
/** Returns the smallest contiguous requested load range for a set of date keys. */
export function dateRangeFromKeys({ dateKeys }: { dateKeys: IsoDate[] }): {
  startDate: IsoDate;
  endDate: IsoDate;
} | null {
  if (dateKeys.length === 0) {
    return null;
  }
  const sorted = [...dateKeys].sort();
  return { startDate: sorted[0], endDate: sorted[sorted.length - 1] };
}
/** Bounded one-month date window used by the infinite scrollbar illusion. */
export type VirtualDateWindow = {
  startDateKey: IsoDate;
  anchorDateKey: IsoDate;
  endDateKey: IsoDate;
  anchorIndex: number;
  count: number;
};
/** Builds the bounded virtual date window around the current anchor date. */
export function virtualDateWindowAround({
  anchorDateKey,
  excludedWeekdays,
  months = 1
}: {
  anchorDateKey: string;
  excludedWeekdays: number[];
  months?: number;
}): VirtualDateWindow {
  const normalizedAnchorDateKey = normalizeAnchorDate({ dateKey: anchorDateKey, excludedWeekdays });
  const anchorDate = fromDateKey({ dateKey: normalizedAnchorDateKey });
  const startDateKey = normalizeAnchorDate({
    dateKey: toDateKey({ date: addCalendarMonths({ date: anchorDate, amount: -months }) }),
    excludedWeekdays
  });
  const endDateKey = normalizeAnchorDate({
    dateKey: toDateKey({ date: addCalendarMonths({ date: anchorDate, amount: months }) }),
    excludedWeekdays
  });
  const anchorIndex = Math.max(
    0,
    virtualOffsetForDate({ anchorDateKey: startDateKey, targetDateKey: normalizedAnchorDateKey, excludedWeekdays })
  );
  const endIndex = Math.max(
    anchorIndex,
    virtualOffsetForDate({ anchorDateKey: startDateKey, targetDateKey: endDateKey, excludedWeekdays })
  );
  return {
    startDateKey,
    anchorDateKey: normalizedAnchorDateKey,
    endDateKey,
    anchorIndex,
    count: endIndex + 1
  };
}
