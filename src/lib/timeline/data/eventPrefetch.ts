import { fromDateKey, toDateKey } from "#quno-internal/timeline/date/dateVirtualization";
import { addCalendarDays } from "#quno-internal/timeline/date/localDate";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { CalendarId, EventPrefetchPolicy, EventPrefetchWindow } from "#quno-internal/timeline/core/types";

/**
 * Keeps one calendar week warm on each side of the rendered dates.
 */
export const defaultEventPrefetchPolicy: EventPrefetchPolicy = ({ visibleDateKeys }) => {
  if (visibleDateKeys.length === 0) {
    return { beforeDays: 0, afterDays: 0 };
  }
  return { beforeDays: 7, afterDays: 7 };
};

export function normalizedPrefetchDays({ value }: { value: number }): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

export function eventLoadDateKeys({
  visibleDateKeys,
  selectedCalendarIds,
  policy
}: {
  visibleDateKeys: readonly string[];
  selectedCalendarIds: readonly CalendarId[];
  policy: EventPrefetchPolicy;
}): string[] {
  const sortedVisibleDateKeys = [...new Set(visibleDateKeys)].sort();
  if (sortedVisibleDateKeys.length === 0) {
    return [];
  }

  const requestedWindow: EventPrefetchWindow = policy({
    visibleDateKeys: sortedVisibleDateKeys as IsoDate[],
    selectedCalendarIds: [...selectedCalendarIds]
  });
  const beforeDays = normalizedPrefetchDays({ value: requestedWindow.beforeDays });
  const afterDays = normalizedPrefetchDays({ value: requestedWindow.afterDays });
  const dateKeys = new Set(sortedVisibleDateKeys);
  const firstDate = fromDateKey({ dateKey: sortedVisibleDateKeys[0] });
  const lastDate = fromDateKey({ dateKey: sortedVisibleDateKeys[sortedVisibleDateKeys.length - 1] });

  for (let offset = 1; offset <= beforeDays; offset += 1) {
    dateKeys.add(toDateKey({ date: addCalendarDays({ date: firstDate, amount: -offset }) }));
  }
  for (let offset = 1; offset <= afterDays; offset += 1) {
    dateKeys.add(toDateKey({ date: addCalendarDays({ date: lastDate, amount: offset }) }));
  }
  return [...dateKeys].sort();
}
