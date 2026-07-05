import { addDays, addMonths, format, isSameDay, parseISO, subMonths } from "date-fns";

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function fromDateKey(dateKey: string): Date {
  return parseISO(`${dateKey}T00:00:00`);
}

export function isWeekdayExcluded(date: Date, excludedWeekdays: number[]): boolean {
  return excludedWeekdays.includes(date.getDay());
}

export function normalizeAnchorDate(dateKey: string, excludedWeekdays: number[]): string {
  let date = fromDateKey(dateKey);
  for (let guard = 0; guard < 7 && isWeekdayExcluded(date, excludedWeekdays); guard += 1) {
    date = addDays(date, 1);
  }
  return toDateKey(date);
}

export function dateAtVirtualOffset(
  anchorDateKey: string,
  offset: number,
  excludedWeekdays: number[]
): string {
  let date = fromDateKey(normalizeAnchorDate(anchorDateKey, excludedWeekdays));
  if (offset === 0) {
    return toDateKey(date);
  }

  const direction = offset > 0 ? 1 : -1;
  let remaining = Math.abs(offset);
  while (remaining > 0) {
    date = addDays(date, direction);
    if (!isWeekdayExcluded(date, excludedWeekdays)) {
      remaining -= 1;
    }
  }
  return toDateKey(date);
}

export function virtualOffsetForDate(
  anchorDateKey: string,
  targetDateKey: string,
  excludedWeekdays: number[]
): number {
  const anchor = fromDateKey(normalizeAnchorDate(anchorDateKey, excludedWeekdays));
  const target = fromDateKey(targetDateKey);
  if (isSameDay(anchor, target)) {
    return 0;
  }

  const direction = target > anchor ? 1 : -1;
  let date = anchor;
  let offset = 0;
  while (!isSameDay(date, target)) {
    date = addDays(date, direction);
    if (!isWeekdayExcluded(date, excludedWeekdays)) {
      offset += direction;
    }
  }
  return offset;
}

export function dateRangeFromKeys(dateKeys: string[]): { startDate: string; endDate: string } | null {
  if (dateKeys.length === 0) {
    return null;
  }
  const sorted = [...dateKeys].sort();
  return { startDate: sorted[0], endDate: sorted[sorted.length - 1] };
}

export type VirtualDateWindow = {
  startDateKey: string;
  anchorDateKey: string;
  endDateKey: string;
  anchorIndex: number;
  count: number;
};

export function virtualDateWindowAround(
  anchorDateKey: string,
  excludedWeekdays: number[],
  months = 1
): VirtualDateWindow {
  const normalizedAnchorDateKey = normalizeAnchorDate(anchorDateKey, excludedWeekdays);
  const anchorDate = fromDateKey(normalizedAnchorDateKey);
  const startDateKey = normalizeAnchorDate(toDateKey(subMonths(anchorDate, months)), excludedWeekdays);
  const endDateKey = normalizeAnchorDate(toDateKey(addMonths(anchorDate, months)), excludedWeekdays);
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
