import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import { intersectingIndexes } from "./extents";
import type { Geometry, RenderWindow, Viewport } from "./types";

export function renderWindow({
  geometry,
  viewport,
  pinnedDate,
  pinnedResources = new Map()
}: {
  geometry: Geometry;
  viewport: Viewport;
  pinnedDate?: IsoDate;
  pinnedResources?: ReadonlyMap<IsoDate, readonly string[]>;
}): RenderWindow {
  const visible = intersectingIndexes({
    extents: geometry.dateExtents,
    start: viewport.top + geometry.settings.dayHeaderHeight,
    end: viewport.top + viewport.height
  });
  const pin = pinnedDate ? geometry.dateIndex.get(pinnedDate) : undefined;
  const dateIndexes = intersectingIndexes({
    extents: geometry.dateExtents,
    start: viewport.top,
    end: viewport.top + viewport.height,
    overscan: 5,
    pins: pin === undefined ? [] : [pin]
  });
  const resourceIndexes = new Map<IsoDate, readonly number[]>();
  for (const index of dateIndexes) {
    const day = geometry.dates[index];
    const horizontal = geometry.orientation === "horizontal";
    const ids = new Set(pinnedResources.get(day.dateKey));
    const pins = ids.size
      ? day.resources.flatMap((resource, resourceIndex) => (ids.has(resource.calendarId) ? [resourceIndex] : []))
      : [];
    resourceIndexes.set(
      day.dateKey,
      intersectingIndexes({
        extents: day.resourceExtents,
        start: horizontal ? viewport.top - day.bounds.y : viewport.left,
        end: horizontal ? viewport.top + viewport.height - day.bounds.y : viewport.left + viewport.width,
        overscan: 2,
        pins
      })
    );
  }
  return { visibleDateKeys: visible.map((index) => geometry.dates[index].dateKey), dateIndexes, resourceIndexes };
}

export function samePins({
  first,
  second
}: {
  first: ReadonlyMap<IsoDate, readonly string[]>;
  second: ReadonlyMap<IsoDate, readonly string[]>;
}) {
  return (
    first.size === second.size &&
    [...first].every(([date, ids]) => {
      const next = second.get(date);
      return next?.length === ids.length && ids.every((id, index) => id === next[index]);
    })
  );
}
