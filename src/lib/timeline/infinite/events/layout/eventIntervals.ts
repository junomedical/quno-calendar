import type { CalendarEvent, QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { minutesSinceStartOfDay, timelineEndMinute, timelineStartMinute } from "#quno-internal/timeline/time/time";
/** Visible, same-day interval used by the overlap engine. */
export type EventInterval = {
  event: CalendarEvent;
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
  settings
}: {
  events: readonly CalendarEvent[];
  settings: Pick<QunoInfiniteCalendarSettings, "startHour" | "endHour">;
}): EventInterval[] {
  const timelineStart = timelineStartMinute(settings);
  const timelineEnd = timelineEndMinute(settings);
  return events
    .map((event, sourceIndex) => ({
      event,
      startMinute: Math.max(
        timelineStart,
        minutesSinceStartOfDay({ value: event.start, timeZone: event.calendarTimeZone })
      ),
      endMinute: Math.min(timelineEnd, minutesSinceStartOfDay({ value: event.end, timeZone: event.calendarTimeZone })),
      sourceIndex
    }))
    .filter((interval) => interval.endMinute > timelineStart && interval.startMinute < timelineEnd)
    .sort((argument0, argument1) => compareIntervals({ left: argument0, right: argument1 }));
}
