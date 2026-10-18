import { buildGeometry } from "#quno-internal/timeline/runtime/model/geometry";
import { dateWindow, includedDate } from "#quno-internal/timeline/runtime/model/dates";
import { clampViewport } from "#quno-internal/timeline/runtime/model/projection";
import { renderWindow } from "#quno-internal/timeline/runtime/model/window";
import type { ViewportIntent } from "./ownership";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { Geometry, Viewport } from "#quno-internal/timeline/runtime/model/types";
import type { EngineOptions, EngineSnapshot } from "./types";

export function initialSnapshot({ layout, viewport }: EngineOptions): EngineSnapshot {
  const geometry = layoutGeometry({ layout, viewport });
  const date = includedDate({ date: layout.anchorDate, excludedWeekdays: layout.settings.excludedWeekdays });
  const initial = geometry.dates.find((day) => day.dateKey === date)?.bounds.y ?? 0;
  const position = clampViewport({ geometry, viewport: { ...viewport, top: initial } });
  return {
    revision: 0,
    reason: "initial",
    geometry,
    viewport: position,
    owner: null,
    window: renderWindow({ geometry, viewport: position })
  };
}

const sequences = new WeakMap<
  Geometry,
  { anchor: EngineOptions["layout"]["anchorDate"]; excluded: string; dates: ReturnType<typeof dateWindow> }
>();

export function layoutGeometry({ layout, viewport, previous }: EngineOptions & { previous?: Geometry }): Geometry {
  const old = previous ? sequences.get(previous) : undefined;
  const excluded = JSON.stringify(layout.settings.excludedWeekdays);
  const dates =
    old?.anchor === layout.anchorDate && old.excluded === excluded
      ? old.dates
      : dateWindow({ anchor: layout.anchorDate, excludedWeekdays: layout.settings.excludedWeekdays });
  const geometry = buildGeometry({
    ...layout,
    previous,
    dates,
    viewportWidth: viewport.width
  });
  sequences.set(geometry, { anchor: layout.anchorDate, excluded, dates });
  return geometry;
}

export function pinnedWindow({
  geometry,
  viewport,
  owner,
  date,
  pinned
}: {
  geometry: Geometry;
  viewport: Viewport;
  owner: ViewportIntent | null;
  date?: IsoDate;
  pinned: ReadonlyMap<IsoDate, readonly string[]>;
}) {
  const resources = new Map(pinned);
  if (owner?.anchor.target.calendarId)
    resources.set(owner.anchor.target.dateKey, [
      ...new Set([...(resources.get(owner.anchor.target.dateKey) ?? []), owner.anchor.target.calendarId])
    ]);
  return renderWindow({
    geometry,
    viewport,
    pinnedDate: owner?.anchor.target.dateKey ?? date,
    pinnedResources: resources
  });
}
