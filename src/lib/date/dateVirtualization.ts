/**
 * Domain: Foundation.
 * Responsibility: Normalizes excluded dates and maps virtual offsets to date keys.
 * Preserves: the public compatibility boundary and deterministic cross-domain primitives.
 * Does not own: runtime feature coordination.
 * Failure/cancellation: invalid inputs are normalized or rejected by the documented public contract.
 *
 * @see docs/domains/foundation.md#source-map
 */
import { addCalendarDays, addCalendarMonths, isSameLocalDate, parseIsoDate } from "./localDate";

/** Formats a Date as the calendar's stable `yyyy-MM-dd` date key. */
export function toDateKey(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid time value");
  }

  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

/** Parses a `yyyy-MM-dd` date key as a local midnight Date. */
export function fromDateKey(dateKey: string): Date {
  return parseIsoDate(dateKey);
}

/** Returns whether the date should be removed from the virtual date sequence. */
export function isWeekdayExcluded(date: Date, excludedWeekdays: number[]): boolean {
  return excludedWeekdays.includes(date.getDay());
}

/** Moves an excluded anchor date forward to the next included date. */
export function normalizeAnchorDate(dateKey: string, excludedWeekdays: number[]): string {
  let date = fromDateKey(dateKey);
  for (let guard = 0; guard < 7 && isWeekdayExcluded(date, excludedWeekdays); guard += 1) {
    date = addCalendarDays(date, 1);
  }
  return toDateKey(date);
}

/** Returns the included date key at an offset from an anchor date. */
export function dateAtVirtualOffset(anchorDateKey: string, offset: number, excludedWeekdays: number[]): string {
  let date = fromDateKey(normalizeAnchorDate(anchorDateKey, excludedWeekdays));
  if (offset === 0) {
    return toDateKey(date);
  }

  const direction = offset > 0 ? 1 : -1;
  let remaining = Math.abs(offset);
  while (remaining > 0) {
    date = addCalendarDays(date, direction);
    if (!isWeekdayExcluded(date, excludedWeekdays)) {
      remaining -= 1;
    }
  }
  return toDateKey(date);
}

/** Returns the included-date offset between an anchor and target date key. */
export function virtualOffsetForDate(anchorDateKey: string, targetDateKey: string, excludedWeekdays: number[]): number {
  const anchor = fromDateKey(normalizeAnchorDate(anchorDateKey, excludedWeekdays));
  const target = fromDateKey(targetDateKey);
  if (isSameLocalDate(anchor, target)) {
    return 0;
  }

  const direction = target > anchor ? 1 : -1;
  let date = anchor;
  let offset = 0;
  while (!isSameLocalDate(date, target)) {
    date = addCalendarDays(date, direction);
    if (!isWeekdayExcluded(date, excludedWeekdays)) {
      offset += direction;
    }
  }
  return offset;
}

/** Returns the smallest contiguous requested load range for a set of date keys. */
export function dateRangeFromKeys(dateKeys: string[]): { startDate: string; endDate: string } | null {
  if (dateKeys.length === 0) {
    return null;
  }
  const sorted = [...dateKeys].sort();
  return { startDate: sorted[0], endDate: sorted[sorted.length - 1] };
}

/** Bounded one-month date window used by the infinite scrollbar illusion. */
export type VirtualDateWindow = {
  startDateKey: string;
  anchorDateKey: string;
  endDateKey: string;
  anchorIndex: number;
  count: number;
};

/** Builds the bounded virtual date window around the current anchor date. */
export function virtualDateWindowAround(
  anchorDateKey: string,
  excludedWeekdays: number[],
  months = 1
): VirtualDateWindow {
  const normalizedAnchorDateKey = normalizeAnchorDate(anchorDateKey, excludedWeekdays);
  const anchorDate = fromDateKey(normalizedAnchorDateKey);
  const startDateKey = normalizeAnchorDate(toDateKey(addCalendarMonths(anchorDate, -months)), excludedWeekdays);
  const endDateKey = normalizeAnchorDate(toDateKey(addCalendarMonths(anchorDate, months)), excludedWeekdays);
  const anchorIndex = Math.max(0, virtualOffsetForDate(startDateKey, normalizedAnchorDateKey, excludedWeekdays));
  const endIndex = Math.max(anchorIndex, virtualOffsetForDate(startDateKey, endDateKey, excludedWeekdays));

  return {
    startDateKey,
    anchorDateKey: normalizedAnchorDateKey,
    endDateKey,
    anchorIndex,
    count: endIndex + 1
  };
}
