import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { CalendarEvent, CalendarRow, QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { TIMELINE_LEFT_GUTTER_PX } from "#quno-internal/timeline/time/timelineTicks";
import { prefixExtents } from "./extents";
import { columnWidths } from "./columns";
import type { DayGeometry, DayMetric, Geometry, Orientation } from "./types";

import { resourceGrid, type ResourceGrid } from "./resourceGrid";
const grids = new WeakMap<Geometry, ResourceGrid>();

export type GeometryInput = {
  orientation: Orientation;
  settings: QunoInfiniteCalendarSettings;
  dates: readonly IsoDate[];
  calendars: readonly CalendarRow[];
  metrics: ReadonlyMap<IsoDate, DayMetric>;
  viewportWidth: number;
  widthDateKeys?: readonly IsoDate[];
  draft?: CalendarEvent | null;
};

export function buildGeometry(input: GeometryInput & { previous?: Geometry }): Geometry {
  const { orientation, settings, dates, calendars, viewportWidth } = input;
  const horizontal = orientation === "horizontal";
  const labelWidth = horizontal ? settings.labelWidth : Math.round(settings.labelWidth * 0.7);
  const timeGutter = horizontal ? TIMELINE_LEFT_GUTTER_PX : 8;
  const minutes = Math.max(1, (settings.endHour - settings.startHour) * 60);
  const scale = Math.max(0.5, settings.zoom, horizontal ? (viewportWidth - labelWidth - timeGutter) / minutes : 0);
  const previous = input.previous;
  const oldGrid = previous ? grids.get(previous) : undefined;
  const grid = resourceGrid({ input, previous: oldGrid });
  const resources = grid.rows;
  const widthDates = new Set(input.widthDateKeys ?? dates);
  const minimumWidth = horizontal
    ? 0
    : grid.widths.reduce(
        (maximum, width, index) => (widthDates.has(dates[index]) ? Math.max(maximum, width) : maximum),
        calendars.length * settings.verticalColumnMinWidth
      );
  const width = horizontal
    ? labelWidth + timeGutter + minutes * scale
    : Math.max(viewportWidth, labelWidth + minimumWidth);
  const stableAxis =
    previous?.orientation === orientation &&
    oldGrid === grid &&
    previous.settings.dayHeaderHeight === settings.dayHeaderHeight;
  const dateExtents =
    stableAxis &&
    (horizontal ||
      (previous.scale === scale &&
        previous.settings.startHour === settings.startHour &&
        previous.settings.endHour === settings.endHour))
      ? previous.dateExtents
      : prefixExtents({
          sizes: resources.map(
            (rows) =>
              settings.dayHeaderHeight +
              (horizontal ? rows.reduce((height, row) => height + row.height, 0) : minutes * scale + timeGutter * 2)
          )
        });
  const days: DayGeometry[] = dates.map((dateKey, index) => {
    const bounds = { x: 0, y: dateExtents[index].start, width, height: dateExtents[index].size };
    const rows = resources[index];
    const previousIndex = input.previous?.dateIndex.get(dateKey);
    const previous = previousIndex === undefined ? undefined : input.previous?.dates[previousIndex];
    if (
      previous &&
      input.previous?.orientation === orientation &&
      input.previous.labelWidth === labelWidth &&
      input.previous.settings.dayHeaderHeight === settings.dayHeaderHeight &&
      previous.index === index &&
      previous.bounds.y === bounds.y &&
      previous.bounds.width === width &&
      previous.bounds.height === bounds.height &&
      previous.resources === rows
    )
      return previous;

    const resourceExtents =
      stableAxis &&
      previous &&
      previous.resources === rows &&
      (horizontal || (input.previous?.labelWidth === labelWidth && previous.bounds.width === width))
        ? previous.resourceExtents
        : prefixExtents({
            sizes: horizontal
              ? rows.map((row) => row.height)
              : columnWidths({ minimums: rows.map((row) => row.width), available: width - labelWidth }),
            start: horizontal ? settings.dayHeaderHeight : labelWidth
          });
    return Object.freeze({
      dateKey,
      index,
      bounds,
      resourceExtents,
      resources: rows
    });
  });
  const geometry: Geometry = Object.freeze({
    orientation,
    calendars,
    settings,
    dates: days,
    dateExtents,
    dateIndex: oldGrid === grid && previous ? previous.dateIndex : new Map(dates.map((date, index) => [date, index])),
    width,
    height: dateExtents[dateExtents.length - 1]?.end ?? 0,
    labelWidth,
    timeGutter,
    scale,
    draft: input.draft
  });
  grids.set(geometry, grid);
  return geometry;
}
