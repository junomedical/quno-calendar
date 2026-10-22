import type { CalendarEvent, QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { eventSegment } from "#quno-internal/timeline/infinite/events/eventSegment";
import { eventDateKey } from "#quno-internal/timeline/infinite/events/eventDateKey";
import type { CalendarEventSegment } from "#quno-internal/timeline/core/types";

/** Visible, same-day interval used by the overlap engine. */
export type EventInterval = {
  event: CalendarEvent;
  segment: CalendarEventSegment;
  startMinute: number;
  endMinute: number;
  sourceIndex: number;
};

function compareIntervals({ left, right }: { left: EventInterval; right: EventInterval }): number {
  return (
    left.startMinute - right.startMinute || left.sourceIndex - right.sourceIndex || left.endMinute - right.endMinute
  );
}

/** Clips events and keeps caller order when appointments share a start time. */
export function eventIntervals({
  events,
  settings,
  dateKey
}: {
  events: readonly CalendarEvent[];
  dateKey?: string;
  settings: Pick<QunoInfiniteCalendarSettings, "startHour" | "endHour">;
}): EventInterval[] {
  return events
    .flatMap((event, sourceIndex) => {
      const segment = eventSegment({ event, dateKey: dateKey ?? eventDateKey(event), settings });
      return segment
        ? [{ event, segment, startMinute: segment.startMinute, endMinute: segment.endMinute, sourceIndex }]
        : [];
    })
    .sort((left, right) => compareIntervals({ left, right }));
}
