import type { CalendarEvent, QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { minuteToX, minutesSinceStartOfDay } from "#quno-internal/timeline/time/time";
import { TIMELINE_LEFT_GUTTER_PX } from "#quno-internal/timeline/time/timelineTicks";

/** Pure event geometry: event timestamps -> horizontal shell bounds. */

type HorizontalEventGeometry = {
  left: number;
  width: number;
};

export function horizontalEventGeometry(
  event: Pick<CalendarEvent, "start" | "end" | "calendarTimeZone">,
  settings: Pick<QunoInfiniteCalendarSettings, "startHour" | "endHour" | "zoom">
): HorizontalEventGeometry {
  const startX = minuteToX(minutesSinceStartOfDay(event.start, event.calendarTimeZone), settings);
  const endX = minuteToX(minutesSinceStartOfDay(event.end, event.calendarTimeZone), settings);
  return {
    left: TIMELINE_LEFT_GUTTER_PX + startX,
    width: Math.max(12, endX - startX)
  };
}

export function committedEventHoverWidth(eventLeft: number, eventWidth: number, timelineWidth: number): number {
  const remainingRowWidth = Math.max(eventWidth, TIMELINE_LEFT_GUTTER_PX + timelineWidth - eventLeft);
  return eventWidth >= 250 ? remainingRowWidth : Math.min(250, remainingRowWidth);
}
