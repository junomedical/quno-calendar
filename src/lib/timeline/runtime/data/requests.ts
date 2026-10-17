import { addDays, type IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { EventPrefetchPolicy } from "#quno-internal/timeline/core/types";

export type RangeRequest = {
  id: number;
  generation: number;
  dates: readonly IsoDate[];
  calendarIds: readonly string[];
  controller: AbortController;
};

export function loadDates({
  visibleDates,
  calendarIds,
  policy
}: {
  visibleDates: readonly IsoDate[];
  calendarIds: readonly string[];
  policy: EventPrefetchPolicy;
}): readonly IsoDate[] {
  const dates = [...new Set(visibleDates)].sort();
  if (!dates.length) return [];
  const window = policy({ visibleDateKeys: dates, selectedCalendarIds: calendarIds });
  const before = Number.isFinite(window.beforeDays) ? Math.max(0, Math.trunc(window.beforeDays)) : 0;
  const after = Number.isFinite(window.afterDays) ? Math.max(0, Math.trunc(window.afterDays)) : 0;
  const keys = new Set(dates);
  for (let amount = 1; amount <= before; amount++) keys.add(addDays({ date: dates[0], amount: -amount }));
  for (let amount = 1; amount <= after; amount++) keys.add(addDays({ date: dates[dates.length - 1], amount }));
  return [...keys].sort();
}

export function contiguousRanges({ dates }: { dates: readonly IsoDate[] }): readonly (readonly IsoDate[])[] {
  const groups: IsoDate[][] = [];
  for (const date of [...new Set(dates)].sort()) {
    const last = groups[groups.length - 1];
    if (last && addDays({ date: last[last.length - 1], amount: 1 }) === date) last.push(date);
    else groups.push([date]);
  }
  return groups;
}

export function coversResources({
  available,
  required
}: {
  available: readonly string[];
  required: readonly string[];
}): boolean {
  const ids = new Set(available);
  return required.every((id) => ids.has(id));
}
