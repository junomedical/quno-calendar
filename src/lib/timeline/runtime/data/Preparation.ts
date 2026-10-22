import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import type {
  ActiveEventDraft,
  CalendarEvent,
  CalendarRow,
  QunoInfiniteCalendarSettings
} from "#quno-internal/timeline/core/types";
import type { ProjectEvents } from "#quno-internal/timeline/core/calendarEventProjectionTypes";
import { eventCalendarIds } from "#quno-internal/timeline/data/calendarEvents";
import { eventIntersectsDate } from "#quno-internal/timeline/infinite/events/eventSegment";
import {
  prepareEventLayers,
  rowHeightForPreparedLayers,
  columnWidthForPreparedLayers
} from "#quno-internal/timeline/infinite/events/layout/layout";
import type { DayMetric } from "#quno-internal/timeline/runtime/model/types";

type Entry = { events: readonly CalendarEvent[]; signature: string; metric: DayMetric };
export class Preparation {
  private result: ReadonlyMap<IsoDate, DayMetric> = new Map();
  private dates = new Map<IsoDate, Entry>();

  prepare({
    buckets,
    calendars,
    settings,
    activeDraft
  }: {
    buckets: ReadonlyMap<IsoDate, readonly CalendarEvent[]>;
    calendars: readonly CalendarRow[];
    settings: QunoInfiniteCalendarSettings;
    activeDraft?: ActiveEventDraft | null;
  }): ReadonlyMap<IsoDate, DayMetric> {
    const output = new Map<IsoDate, DayMetric>();
    const source =
      activeDraft?.mode === "edit" ? (activeDraft.sourceEventId ?? activeDraft.event.id) : activeDraft?.sourceEventId;
    const common = JSON.stringify([
      calendars.map((calendar) => calendar.id),
      settings.startHour,
      settings.endHour,
      settings.rowHeight,
      settings.verticalColumnMinWidth,
      settings.verticalColumnOverlapCapacity,
      settings.verticalColumnOverlapGrowth
    ]);
    for (const [dateKey, events] of buckets) {
      const removedId = source && events.some((event) => event.id === source) ? source : null;
      const signature = JSON.stringify([common, removedId]);
      const previous = this.dates.get(dateKey);
      if (previous?.events === events && previous.signature === signature) {
        output.set(dateKey, previous.metric);
        continue;
      }
      const members = new Map(calendars.map((calendar) => [calendar.id, [] as CalendarEvent[]]));
      for (const event of events)
        if (event.id !== removedId) for (const id of eventCalendarIds(event)) members.get(id)?.push(event);
      const metric = {
        dateKey,
        resources: calendars.map((calendar) => {
          const rowEvents = members.get(calendar.id)!;
          const layers = prepareEventLayers({ events: rowEvents, settings, dateKey });
          return {
            calendarId: calendar.id,
            events: rowEvents,
            layers,
            height: rowHeightForPreparedLayers({ preparedLayers: layers, settings }),
            width: columnWidthForPreparedLayers({ preparedLayers: layers, settings })
          };
        })
      };
      this.dates.set(dateKey, { events, signature, metric });
      output.set(dateKey, metric);
    }
    for (const date of this.dates.keys()) if (!buckets.has(date)) this.dates.delete(date);
    if (output.size === this.result.size && [...output].every(([date, metric]) => this.result.get(date) === metric))
      return this.result;
    this.result = output;
    return output;
  }
}

export function projectBuckets({
  buckets,
  dates,
  calendarIds,
  projectEvents
}: {
  buckets: ReadonlyMap<IsoDate, readonly CalendarEvent[]>;
  dates: readonly IsoDate[];
  calendarIds: readonly string[];
  projectEvents?: ProjectEvents;
}): ReadonlyMap<IsoDate, readonly CalendarEvent[]> {
  if (!projectEvents || !dates.length || !calendarIds.length) return buckets;
  const sorted = [...new Set(dates)].sort();
  const groups = new Map(sorted.map((date) => [date, [] as CalendarEvent[]]));
  const projected = projectEvents({
    events: [...new Map(sorted.flatMap((date) => buckets.get(date) ?? []).map((event) => [event.id, event])).values()],
    startDate: sorted[0],
    endDate: sorted[sorted.length - 1],
    calendarIds
  });
  for (const event of new Map(projected.map((event) => [event.id, event])).values())
    for (const [dateKey, events] of groups) if (eventIntersectsDate({ event, dateKey })) events.push(event);
  const output = new Map(buckets);
  for (const [date, events] of groups) {
    const previous = buckets.get(date);
    output.set(
      date,
      previous?.length === events.length && events.every((event, index) => event === previous[index])
        ? previous
        : events
    );
  }
  return output;
}
