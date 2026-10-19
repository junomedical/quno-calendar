import { addDays, type IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { EventPrefetchPolicy } from "#quno-internal/timeline/core/types";
import type { Geometry, Viewport } from "#quno-internal/timeline/runtime/model/types";
import { intersectingIndexes } from "#quno-internal/timeline/runtime/model/extents";

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
  policy,
  geometry,
  viewport
}: {
  visibleDates: readonly IsoDate[];
  calendarIds: readonly string[];
  policy: EventPrefetchPolicy;
  geometry?: Geometry;
  viewport?: Viewport;
}): readonly IsoDate[] {
  const dates = [...new Set(visibleDates)].sort();
  if (!dates.length) return [];
  const window = policy({ visibleDateKeys: dates, selectedCalendarIds: calendarIds });
  if ("beforeScreens" in window) {
    if (!geometry || !viewport) return dates;
    const screenHeight = Math.max(0, viewport.height - geometry.settings.dayHeaderHeight);
    const screens = ({ value }: { value: number }) => (Number.isFinite(value) ? Math.max(0, value) : 0);
    const before = screens({ value: window.beforeScreens });
    const after = screens({ value: window.afterScreens });
    const indexes = new Set(
      intersectingIndexes({
        extents: geometry.dateExtents,
        start: viewport.top + geometry.settings.dayHeaderHeight - screenHeight * before,
        end: viewport.top + viewport.height + screenHeight * after
      })
    );
    const first = geometry.dateIndex.get(dates[0]);
    const last = geometry.dateIndex.get(dates[dates.length - 1]);
    if (before > 0 && first !== undefined && first > 0) indexes.add(first - 1);
    if (after > 0 && last !== undefined && last + 1 < geometry.dates.length) indexes.add(last + 1);
    return [...indexes].sort((left, right) => left - right).map((index) => geometry.dates[index].dateKey);
  }
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
