import type { CalendarEvent, QunoCalendarSettings } from "#quno-internal/timeline/core/types";
import { minutesSinceStartOfDay, timelineEndMinute, timelineStartMinute } from "#quno-internal/timeline/time/time";

/** Visible, same-day interval used by the overlap engine. */
export type EventInterval = {
  event: CalendarEvent;
  startMinute: number;
  endMinute: number;
  sourceIndex: number;
};

function compareIntervals(left: EventInterval, right: EventInterval): number {
  return (
    left.startMinute - right.startMinute || left.sourceIndex - right.sourceIndex || left.endMinute - right.endMinute
  );
}

/** Clips events and keeps caller order when appointments share a start time. */
export function eventIntervals(
  events: readonly CalendarEvent[],
  settings: Pick<QunoCalendarSettings, "startHour" | "endHour">
): EventInterval[] {
  const timelineStart = timelineStartMinute(settings);
  const timelineEnd = timelineEndMinute(settings);

  return events
    .map((event, sourceIndex) => ({
      event,
      startMinute: Math.max(timelineStart, minutesSinceStartOfDay(event.start)),
      endMinute: Math.min(timelineEnd, minutesSinceStartOfDay(event.end)),
      sourceIndex
    }))
    .filter((interval) => interval.endMinute > timelineStart && interval.startMinute < timelineEnd)
    .sort(compareIntervals);
}
