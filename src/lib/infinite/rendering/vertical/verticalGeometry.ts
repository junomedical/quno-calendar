/**
 * Pure vertical geometry.
 * event/time input -> clamped timeline pixels + fixed visual gutter
 */
import type { CalendarEvent, TimelineSettings } from "#calendar-internal/core/types";
import type { EventColumnLayoutItem } from "../../events/layout/layout";
import { minuteToY, minutesSinceStartOfDay } from "#calendar-internal/time/time";

export const VERTICAL_COLUMN_GAP_PX = 0;
export const VERTICAL_TIMELINE_GUTTER_PX = 8;

type VerticalGeometrySettings = Pick<TimelineSettings, "startHour" | "endHour" | "zoom">;

export function verticalMinuteToY(minute: number, settings: VerticalGeometrySettings): number {
  return VERTICAL_TIMELINE_GUTTER_PX + minuteToY(minute, settings);
}

/** Converts event time into the positioned block shared by transient and availability layers. */
export function verticalEventBox(event: CalendarEvent, settings: VerticalGeometrySettings) {
  const startMinute = minutesSinceStartOfDay(event.start);
  const endMinute = minutesSinceStartOfDay(event.end);
  return {
    top: verticalMinuteToY(startMinute, settings),
    height: Math.max(12, minuteToY(endMinute, settings) - minuteToY(startMinute, settings))
  };
}

export function positionColumnLayoutItems(items: EventColumnLayoutItem[]): EventColumnLayoutItem[] {
  return items.map((item) => ({ ...item, top: item.top + VERTICAL_TIMELINE_GUTTER_PX }));
}
