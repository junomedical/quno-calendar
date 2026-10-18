import type { GeometryInput } from "./geometry";
import type { ResourceMetric } from "./types";

const EMPTY_EVENTS = Object.freeze([]);
const EMPTY_CELL = { items: [], laneCount: 1, metricLaneCount: 1 };
const EMPTY_LAYERS = { events: EMPTY_CELL, availability: EMPTY_CELL, metricLaneCount: 1 };

export type ResourceGrid = Pick<GeometryInput, "dates" | "calendars" | "metrics"> & {
  rowHeight: number;
  columnWidth: number;
  rows: readonly (readonly ResourceMetric[])[];
  widths: readonly number[];
};

/** Zoom never changes membership, prepared lanes or minimum resource sizes. */
export function resourceGrid({ input, previous }: { input: GeometryInput; previous?: ResourceGrid }): ResourceGrid {
  const { dates, calendars, metrics, settings } = input;
  if (
    previous &&
    previous.calendars === calendars &&
    previous.metrics === metrics &&
    previous.rowHeight === settings.rowHeight &&
    previous.columnWidth === settings.verticalColumnMinWidth &&
    previous.dates.length === dates.length &&
    previous.dates.every((date, index) => date === dates[index])
  )
    return previous;
  const empty = calendars.map((calendar): ResourceMetric => ({
    calendarId: calendar.id,
    events: EMPTY_EVENTS,
    layers: EMPTY_LAYERS,
    height: settings.rowHeight,
    width: settings.verticalColumnMinWidth
  }));
  const rows = dates.map((date) => {
    const resources = metrics.get(date)?.resources;
    if (!resources) return empty;
    if (
      resources.length === calendars.length &&
      resources.every((resource, index) => resource.calendarId === calendars[index].id)
    )
      return resources;
    const byId = new Map(resources.map((resource) => [resource.calendarId, resource]));
    return calendars.map((calendar, index) => byId.get(calendar.id) ?? empty[index]);
  });
  return {
    dates,
    calendars,
    metrics,
    rowHeight: settings.rowHeight,
    columnWidth: settings.verticalColumnMinWidth,
    rows,
    widths: rows.map((resources) => resources.reduce((width, resource) => width + resource.width, 0))
  };
}
