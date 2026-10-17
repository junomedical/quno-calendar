import type { QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { minuteToY, yToMinute } from "#quno-internal/timeline/time/time";
import { nearestTimeNodeMinute } from "#quno-internal/timeline/time/timelineTicks";

export type VerticalWheelAnchor = {
  dateKey: string;
  minute: number;
  screenY: number;
  scrollLeft: number;
  pageX: number;
  pageY: number;
};

export function captureVerticalWheelAnchor({
  viewport,
  event,
  settings,
  timelineGutterPx
}: {
  viewport: HTMLDivElement;
  event: WheelEvent;
  settings: QunoInfiniteCalendarSettings;
  timelineGutterPx: number;
}): VerticalWheelAnchor | null {
  const day = Array.from(viewport.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]')).find((element) => {
    const box = element.getBoundingClientRect();
    return event.clientY >= box.top && event.clientY <= box.bottom;
  });
  if (!day?.dataset.date) return null;
  const origin = day.getBoundingClientRect().top + settings.dayHeaderHeight + timelineGutterPx;
  const minute = nearestTimeNodeMinute({
    minute: yToMinute({ y: event.clientY - origin, geometry: settings }),
    settings
  });
  return {
    dateKey: day.dataset.date,
    minute,
    screenY: origin + minuteToY({ minute, geometry: settings }) - viewport.getBoundingClientRect().top,
    scrollLeft: viewport.scrollLeft,
    pageX: window.scrollX,
    pageY: window.scrollY
  };
}

export function restoreVerticalWheelAnchor({
  viewport,
  anchor,
  settings,
  timelineGutterPx
}: {
  viewport: HTMLDivElement;
  anchor: VerticalWheelAnchor;
  settings: QunoInfiniteCalendarSettings;
  timelineGutterPx: number;
}) {
  const day = Array.from(viewport.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]')).find(
    (element) => element.dataset.date === anchor.dateKey
  );
  if (!day) return;
  const offset = settings.dayHeaderHeight + timelineGutterPx + minuteToY({ minute: anchor.minute, geometry: settings });
  const currentScreenY = day.getBoundingClientRect().top - viewport.getBoundingClientRect().top + offset;
  viewport.scrollTop = Math.max(0, viewport.scrollTop + currentScreenY - anchor.screenY);
  viewport.scrollLeft = anchor.scrollLeft;
  window.scrollTo(anchor.pageX, anchor.pageY);
}
