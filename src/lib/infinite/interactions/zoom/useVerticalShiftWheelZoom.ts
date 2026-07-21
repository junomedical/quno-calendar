/**
 * Domain: Interactions.
 * Responsibility: Anchors vertical shift-wheel zoom to the pointer date/time location.
 * Preserves: mounted-grid hit testing and controlled parent ownership.
 * Does not own: product rendering and direct settings mutation.
 * Failure/cancellation: cancelled or invalid gestures clear transient state without committing.
 *
 * @see docs/domains/interactions.md#source-map
 */
import { useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { minuteToY, yToMinute } from "../../../time/time";
import { nearestTimeNodeMinute } from "../../../time/timelineTicks";
import {
  captureWheelEvent,
  extendGestureTail,
  gestureTailIsActive,
  nextRestoreVersion,
  nextZoomFromWheel,
  restoreAcrossFrames,
  restoreIsCurrent,
  useCapturedWheel,
  useFrameCoalescedWheelZoom,
  type SharedZoomArgs
} from "./shiftWheelZoomUtils";

type VerticalZoomArgs = SharedZoomArgs & {
  rememberVisibleDateOffset: (dateKey: string, offsetWithinDate: number) => void;
  updateTopVisibleDate: () => void;
  timelineGutterPx: number;
};

type VerticalAnchor = { dateKey: string | null; minute: number; screenY: number };

/** Keeps a rendered date/time node fixed while controlled vertical zoom settles. */
export function useVerticalShiftWheelZoom(args: VerticalZoomArgs) {
  const gestureTailRef = useRef(0);
  const anchorRef = useRef<VerticalAnchor | null>(null);
  const restoreVersionRef = useRef(0);
  const scheduleWheelZoom = useFrameCoalescedWheelZoom(args.settings.zoom);

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (!args.onZoomChange) return;
      if (!event.shiftKey) {
        if (gestureTailIsActive(gestureTailRef)) {
          nextRestoreVersion(restoreVersionRef);
          args.clearScrollEndTimer();
          captureWheelEvent(event);
        } else {
          anchorRef.current = null;
        }
        return;
      }

      const viewport = args.containerRef.current;
      if (!viewport || nextZoomFromWheel(args.settings, event) === null) return;

      const viewportBox = viewport.getBoundingClientRect();
      const activeAnchor = gestureTailIsActive(gestureTailRef) ? anchorRef.current : null;
      const day = activeAnchor ? null : dayAtPoint(viewport, event.clientY);
      const dateKey = activeAnchor?.dateKey ?? day?.dataset.date ?? null;
      const dayY = day ? event.clientY - day.getBoundingClientRect().top : 0;
      const minute =
        activeAnchor?.minute ??
        nearestTimeNodeMinute(
          yToMinute(dayY - args.settings.dayHeaderHeight - args.timelineGutterPx, args.settings),
          args.settings
        );
      const screenY =
        activeAnchor?.screenY ??
        (day
          ? day.getBoundingClientRect().top -
            viewportBox.top +
            args.settings.dayHeaderHeight +
            args.timelineGutterPx +
            minuteToY(minute, args.settings)
          : event.clientY - viewportBox.top);
      const scrollLeft = viewport.scrollLeft;
      const pageScroll = { x: window.scrollX, y: window.scrollY };

      args.updateTopVisibleDate();
      args.clearScrollEndTimer();
      captureWheelEvent(event);
      anchorRef.current = { dateKey, minute, screenY };
      extendGestureTail(gestureTailRef);
      scheduleWheelZoom(args.settings, event, (nextZoom) => {
        const restoreVersion = nextRestoreVersion(restoreVersionRef);
        if (nextZoom !== args.settings.zoom) flushSync(() => args.onZoomChange?.(nextZoom));
        const nextSettings = { ...args.settings, zoom: nextZoom };
        restoreAcrossFrames(() => {
          if (!restoreIsCurrent(restoreVersionRef, restoreVersion)) return;
          const anchoredDay = dateKey ? dayForDate(viewport, dateKey) : null;
          if (anchoredDay) {
            const offset = args.settings.dayHeaderHeight + args.timelineGutterPx + minuteToY(minute, nextSettings);
            const currentScreenY =
              anchoredDay.getBoundingClientRect().top - viewport.getBoundingClientRect().top + offset;
            args.rememberVisibleDateOffset(dateKey!, Math.max(0, offset - screenY));
            viewport.scrollTop = Math.max(0, viewport.scrollTop + currentScreenY - screenY);
          }
          viewport.scrollLeft = scrollLeft;
          window.scrollTo(pageScroll.x, pageScroll.y);
        }, 9);
      });
    },
    [args, scheduleWheelZoom]
  );

  useCapturedWheel(args.containerRef, handleWheel);
}

function dayAtPoint(viewport: HTMLElement, clientY: number) {
  return (
    Array.from(viewport.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]')).find((element) => {
      const box = element.getBoundingClientRect();
      return clientY >= box.top && clientY <= box.bottom;
    }) ?? null
  );
}

function dayForDate(viewport: HTMLElement, dateKey: string) {
  return Array.from(viewport.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]')).find(
    (element) => element.dataset.date === dateKey
  );
}
