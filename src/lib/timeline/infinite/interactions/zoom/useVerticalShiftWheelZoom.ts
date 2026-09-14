import { useCallback, useRef } from "react";
import { minuteToY, yToMinute } from "#quno-internal/timeline/time/time";
import { nearestTimeNodeMinute } from "#quno-internal/timeline/time/timelineTicks";
import {
  captureWheelEvent,
  extendGestureTail,
  gestureTailIsActive,
  nextRestoreVersion,
  nextZoomFromWheel,
  restoreIsCurrent,
  scheduleZoomCommit,
  useCapturedWheel,
  useFrameCoalescedWheelZoom,
  type SharedZoomArgs
} from "./shiftWheelZoomUtils";

type VerticalZoomArgs = SharedZoomArgs & {
  rememberVisibleDateOffset: (args: { dateKey: string; offsetWithinDate: number }) => void;
  updateTopVisibleDate: () => void;
  timelineGutterPx: number;
};

type VerticalAnchor = { dateKey: string | null; minute: number; screenY: number };

/** Keeps a rendered date/time node fixed while controlled vertical zoom settles. */
export function useVerticalShiftWheelZoom(args: VerticalZoomArgs) {
  const gestureTailRef = useRef(0);
  const anchorRef = useRef<VerticalAnchor | null>(null);
  const restoreVersionRef = useRef(0);
  const scheduleWheelZoom = useFrameCoalescedWheelZoom({ controlledZoom: args.settings.zoom });

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
      if (!viewport || nextZoomFromWheel({ settings: args.settings, event }) === null) return;

      const viewportBox = viewport.getBoundingClientRect();
      const activeAnchor = gestureTailIsActive(gestureTailRef) ? anchorRef.current : null;
      const day = activeAnchor ? null : dayAtPoint({ viewport, clientY: event.clientY });
      const dateKey = activeAnchor?.dateKey ?? day?.dataset.date ?? null;
      const dayY = day ? event.clientY - day.getBoundingClientRect().top : 0;
      const minute =
        activeAnchor?.minute ??
        nearestTimeNodeMinute({
          minute: yToMinute({
            y: dayY - args.settings.dayHeaderHeight - args.timelineGutterPx,
            geometry: args.settings
          }),
          settings: args.settings
        });
      const screenY =
        activeAnchor?.screenY ??
        (day
          ? day.getBoundingClientRect().top -
            viewportBox.top +
            args.settings.dayHeaderHeight +
            args.timelineGutterPx +
            minuteToY({ minute, geometry: args.settings })
          : event.clientY - viewportBox.top);
      const scrollLeft = viewport.scrollLeft;
      const pageScroll = { x: window.scrollX, y: window.scrollY };

      args.updateTopVisibleDate();
      args.clearScrollEndTimer();
      captureWheelEvent(event);
      anchorRef.current = { dateKey, minute, screenY };
      extendGestureTail(gestureTailRef);
      scheduleWheelZoom({
        settings: args.settings,
        event,
        commit: ({ zoom: nextZoom }) => {
          const restoreVersion = nextRestoreVersion(restoreVersionRef);
          const nextSettings = { ...args.settings, zoom: nextZoom };
          scheduleZoomCommit({
            commit: () => {
              if (nextZoom !== args.settings.zoom) args.onZoomChange?.({ zoom: nextZoom });
            },
            restore: () => {
              if (!restoreIsCurrent({ versionRef: restoreVersionRef, version: restoreVersion })) return;
              const anchoredDay = dateKey ? dayForDate({ viewport, dateKey }) : null;
              if (anchoredDay) {
                const offset =
                  args.settings.dayHeaderHeight + args.timelineGutterPx + minuteToY({ minute, geometry: nextSettings });
                const currentScreenY =
                  anchoredDay.getBoundingClientRect().top - viewport.getBoundingClientRect().top + offset;
                args.rememberVisibleDateOffset({ dateKey: dateKey!, offsetWithinDate: Math.max(0, offset - screenY) });
                viewport.scrollTop = Math.max(0, viewport.scrollTop + currentScreenY - screenY);
              }
              viewport.scrollLeft = scrollLeft;
              window.scrollTo(pageScroll.x, pageScroll.y);
            },
            restoreFrameCount: 9
          });
        }
      });
    },
    [args, scheduleWheelZoom]
  );

  useCapturedWheel({ ref: args.containerRef, listener: handleWheel });
}

function dayAtPoint({ viewport, clientY }: { viewport: HTMLElement; clientY: number }) {
  return (
    Array.from(viewport.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]')).find((element) => {
      const box = element.getBoundingClientRect();
      return clientY >= box.top && clientY <= box.bottom;
    }) ?? null
  );
}

function dayForDate({ viewport, dateKey }: { viewport: HTMLElement; dateKey: string }) {
  return Array.from(viewport.querySelectorAll<HTMLElement>('[data-testid="calendar-day"]')).find(
    (element) => element.dataset.date === dateKey
  );
}
