/**
 * Domain: Rendering.
 * Responsibility: Converts layout lanes and time intervals into horizontal CSS geometry.
 * Preserves: stable geometry, layering, clipping, and external renderer isolation.
 * Does not own: requests, controlled settings, and scroll correction.
 * Failure/cancellation: missing optional content leaves structural calendar geometry intact.
 *
 * @see docs/domains/rendering.md#source-map
 */
import type { CalendarEvent, TimelineSettings } from "../../../core/types";
import { minuteToX, minutesSinceStartOfDay } from "../../../time/time";
import { TIMELINE_LEFT_GUTTER_PX } from "../../../time/timelineTicks";

/** Pure event geometry: event timestamps -> horizontal shell bounds. */

type HorizontalEventGeometry = {
  left: number;
  width: number;
};

export function horizontalEventGeometry(
  event: Pick<CalendarEvent, "start" | "end">,
  settings: Pick<TimelineSettings, "startHour" | "endHour" | "zoom">
): HorizontalEventGeometry {
  const startX = minuteToX(minutesSinceStartOfDay(event.start), settings);
  const endX = minuteToX(minutesSinceStartOfDay(event.end), settings);
  return {
    left: TIMELINE_LEFT_GUTTER_PX + startX,
    width: Math.max(12, endX - startX)
  };
}

export function committedEventHoverWidth(eventLeft: number, eventWidth: number, timelineWidth: number): number {
  const remainingRowWidth = Math.max(eventWidth, TIMELINE_LEFT_GUTTER_PX + timelineWidth - eventLeft);
  return eventWidth >= 250 ? remainingRowWidth : Math.min(250, remainingRowWidth);
}
