import type { QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { minuteToX, xToMinute } from "#quno-internal/timeline/time/time";
import { nearestTimeNodeMinute, TIMELINE_LEFT_GUTTER_PX } from "#quno-internal/timeline/time/timelineTicks";

export type HorizontalWheelAnchor = {
  minute: number;
  screenX: number;
  scrollTop: number;
  pageX: number;
  pageY: number;
};

export function captureHorizontalWheelAnchor({
  viewport,
  event,
  settings
}: {
  viewport: HTMLDivElement;
  event: WheelEvent;
  settings: QunoInfiniteCalendarSettings;
}): HorizontalWheelAnchor {
  const pointerX = event.clientX - viewport.getBoundingClientRect().left;
  const origin = settings.labelWidth + TIMELINE_LEFT_GUTTER_PX;
  const minute = nearestTimeNodeMinute({
    minute: xToMinute({ x: pointerX + viewport.scrollLeft - origin, geometry: settings }),
    settings
  });
  return {
    minute,
    screenX: origin + minuteToX({ minute, geometry: settings }) - viewport.scrollLeft,
    scrollTop: viewport.scrollTop,
    pageX: window.scrollX,
    pageY: window.scrollY
  };
}

export function restoreHorizontalWheelAnchor({
  viewport,
  anchor,
  settings
}: {
  viewport: HTMLDivElement;
  anchor: HorizontalWheelAnchor;
  settings: QunoInfiniteCalendarSettings;
}) {
  viewport.scrollTop = anchor.scrollTop;
  viewport.scrollLeft =
    settings.labelWidth +
    TIMELINE_LEFT_GUTTER_PX +
    minuteToX({ minute: anchor.minute, geometry: settings }) -
    anchor.screenX;
  window.scrollTo(anchor.pageX, anchor.pageY);
}
