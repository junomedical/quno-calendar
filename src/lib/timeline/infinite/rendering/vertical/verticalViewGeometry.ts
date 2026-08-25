/**
 * Pure vertical-view geometry.
 * settings + current clock -> day dimensions, layout identity, and now-line state
 */
import type { QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { toDateKey } from "#quno-internal/timeline/date/dateVirtualization";
import { timelineEndMinute, timelineHeight, timelineStartMinute } from "#quno-internal/timeline/time/time";
import { VERTICAL_TIMELINE_GUTTER_PX } from "./VerticalTimelineDay";

const VERTICAL_LEFT_PANE_WIDTH_RATIO = 0.7;

export type VerticalViewGeometry = {
  labelWidth: number;
  timelineHeight: number;
  dayHeight: number;
};

export function buildVerticalViewGeometry(settings: QunoInfiniteCalendarSettings): VerticalViewGeometry {
  const labelWidth = Math.round(settings.labelWidth * VERTICAL_LEFT_PANE_WIDTH_RATIO);
  const dayTimelineHeight = timelineHeight(settings) + VERTICAL_TIMELINE_GUTTER_PX * 2;
  return {
    labelWidth,
    timelineHeight: dayTimelineHeight,
    dayHeight: settings.dayHeaderHeight + dayTimelineHeight
  };
}

export function buildVerticalLayoutSignature(settings: QunoInfiniteCalendarSettings): string {
  return `${settings.dayHeaderHeight}:${settings.startHour}:${settings.endHour}:${settings.zoom}:${settings.excludedWeekdays.join("|")}`;
}

export function resolveVerticalDateOffset(
  offsetWithinDate: number,
  previousDayHeight: number,
  nextDayHeight: number,
  dayHeaderHeight: number
): number {
  if (offsetWithinDate <= dayHeaderHeight) {
    return Math.min(offsetWithinDate, Math.max(0, nextDayHeight - 1));
  }
  const previousTimelineHeight = Math.max(1, previousDayHeight - dayHeaderHeight);
  const nextTimelineHeight = Math.max(1, nextDayHeight - dayHeaderHeight);
  const relativeTimelineOffset = (offsetWithinDate - dayHeaderHeight) / previousTimelineHeight;
  return Math.min(Math.max(0, nextDayHeight - 1), dayHeaderHeight + relativeTimelineOffset * nextTimelineHeight);
}

export function buildVerticalNowState(now: Date, settings: QunoInfiniteCalendarSettings) {
  const minute = now.getHours() * 60 + now.getMinutes();
  return {
    dateKey: toDateKey(now),
    minute,
    showLine: minute >= timelineStartMinute(settings) && minute <= timelineEndMinute(settings)
  };
}
