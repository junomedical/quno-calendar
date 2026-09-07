import { useCallback, useRef } from "react";
import { minuteToX, xToMinute } from "#quno-internal/timeline/time/time";
import type { QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { nearestTimeNodeMinute, TIMELINE_LEFT_GUTTER_PX } from "#quno-internal/timeline/time/timelineTicks";
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

type HorizontalZoomArgs = SharedZoomArgs & {
  effectiveSettings: QunoInfiniteCalendarSettings;
  horizontalRenderZoomFloor: number;
};

type HorizontalAnchor = { minute: number; screenX: number };

/** Keeps the first focused time node fixed for one horizontal wheel gesture. */
export function useHorizontalShiftWheelZoom(args: HorizontalZoomArgs) {
  const gestureTailRef = useRef(0);
  const anchorRef = useRef<HorizontalAnchor | null>(null);
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
      const pointerX = event.clientX - viewportBox.left;
      const activeAnchor = gestureTailIsActive(gestureTailRef) ? anchorRef.current : null;
      const minute =
        activeAnchor?.minute ??
        nearestTimeNodeMinute({
          minute: xToMinute({
            x: pointerX + viewport.scrollLeft - args.settings.labelWidth - TIMELINE_LEFT_GUTTER_PX,
            geometry: args.effectiveSettings
          }),
          settings: args.effectiveSettings
        });
      const screenX =
        activeAnchor?.screenX ??
        args.settings.labelWidth +
          TIMELINE_LEFT_GUTTER_PX +
          minuteToX({ minute, geometry: args.effectiveSettings }) -
          viewport.scrollLeft;
      const scrollTop = viewport.scrollTop;
      const pageScroll = { x: window.scrollX, y: window.scrollY };

      args.clearScrollEndTimer();
      captureWheelEvent(event);
      anchorRef.current = { minute, screenX };
      extendGestureTail(gestureTailRef);
      scheduleWheelZoom({
        settings: args.settings,
        event,
        commit: ({ zoom: nextZoom }) => {
          const restoreVersion = nextRestoreVersion(restoreVersionRef);
          const nextSettings = {
            ...args.effectiveSettings,
            zoom: Math.max(nextZoom, args.horizontalRenderZoomFloor)
          };
          scheduleZoomCommit({
            commit: () => {
              if (nextZoom !== args.settings.zoom) args.onZoomChange?.({ zoom: nextZoom });
            },
            restore: () => {
              if (!restoreIsCurrent({ versionRef: restoreVersionRef, version: restoreVersion })) return;
              viewport.scrollTop = scrollTop;
              viewport.scrollLeft =
                args.settings.labelWidth +
                TIMELINE_LEFT_GUTTER_PX +
                minuteToX({ minute, geometry: nextSettings }) -
                screenX;
              window.scrollTo(pageScroll.x, pageScroll.y);
            },
            restoreFrameCount: 3
          });
        }
      });
    },
    [args, scheduleWheelZoom]
  );

  useCapturedWheel({ ref: args.containerRef, listener: handleWheel });

  return {
    isGestureZoomActive: useCallback(() => gestureTailIsActive(gestureTailRef), [])
  };
}
