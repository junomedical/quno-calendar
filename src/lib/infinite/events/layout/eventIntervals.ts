import type { CalendarEvent, TimelineSettings } from "../../../core/types";
import { minutesSinceStartOfDay, timelineEndMinute, timelineStartMinute } from "../../../time/time";

/** Visible, same-day interval used by the overlap engine. */
export type EventInterval = {
  event: CalendarEvent;
  startMinute: number;
  endMinute: number;
  sourceIndex: number;
};

function compareIntervals(left: EventInterval, right: EventInterval): number {
  return (
    left.startMinute - right.startMinute || left.endMinute - right.endMinute || left.sourceIndex - right.sourceIndex
  );
}

/** Clips events to the visible timeline and orders equal intervals by caller order. */
export function eventIntervals(
  events: readonly CalendarEvent[],
  settings: Pick<TimelineSettings, "startHour" | "endHour">
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
