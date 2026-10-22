import type { CalendarEvent } from "#quno-internal/timeline/core/types";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { Geometry } from "./types";
import { eventSegment, firstEventSegment } from "#quno-internal/timeline/infinite/events/eventSegment";
import { eventCalendarIds } from "#quno-internal/timeline/data/calendarEvents";

export function transientPins({
  geometry,
  visibleDates,
  draft,
  preview
}: {
  geometry: Geometry;
  visibleDates: readonly IsoDate[];
  draft: CalendarEvent | null;
  preview: CalendarEvent | null;
}) {
  const resources = new Map<IsoDate, readonly string[]>();
  for (const event of [draft, preview]) {
    if (!event) continue;
    for (const { dateKey } of geometry.dates) {
      if (!eventSegment({ event, dateKey, settings: geometry.settings })) continue;
      resources.set(dateKey, [...new Set([...(resources.get(dateKey) ?? []), ...eventCalendarIds(event)])]);
    }
  }
  const date = draft
    ? (visibleDates.find((dateKey) => eventSegment({ event: draft, dateKey, settings: geometry.settings })) ??
      firstEventSegment({ event: draft, settings: geometry.settings })?.dateKey)
    : undefined;
  return { date, resources };
}
