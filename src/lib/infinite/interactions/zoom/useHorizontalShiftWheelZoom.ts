import { useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { minuteToX, xToMinute } from "../../../time/time";
import type { TimelineSettings } from "../../../core/types";
import { nearestTimeNodeMinute, TIMELINE_LEFT_GUTTER_PX } from "../../../time/timelineTicks";
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

type HorizontalZoomArgs = SharedZoomArgs & {
  effectiveSettings: TimelineSettings;
  horizontalRenderZoomFloor: number;
};

type HorizontalAnchor = { minute: number; screenX: number };

/** Keeps the first focused time node fixed for one horizontal wheel gesture. */
export function useHorizontalShiftWheelZoom(args: HorizontalZoomArgs) {
  const gestureTailRef = useRef(0);
  const anchorRef = useRef<HorizontalAnchor | null>(null);
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
      const pointerX = event.clientX - viewportBox.left;
      const activeAnchor = gestureTailIsActive(gestureTailRef) ? anchorRef.current : null;
      const minute =
        activeAnchor?.minute ??
        nearestTimeNodeMinute(
          xToMinute(
            pointerX + viewport.scrollLeft - args.settings.labelWidth - TIMELINE_LEFT_GUTTER_PX,
            args.effectiveSettings
          ),
          args.effectiveSettings
        );
      const screenX =
        activeAnchor?.screenX ??
        args.settings.labelWidth +
          TIMELINE_LEFT_GUTTER_PX +
          minuteToX(minute, args.effectiveSettings) -
          viewport.scrollLeft;
      const scrollTop = viewport.scrollTop;
      const pageScroll = { x: window.scrollX, y: window.scrollY };

      args.clearScrollEndTimer();
      captureWheelEvent(event);
      anchorRef.current = { minute, screenX };
      extendGestureTail(gestureTailRef);
      scheduleWheelZoom(args.settings, event, (nextZoom) => {
        const restoreVersion = nextRestoreVersion(restoreVersionRef);
        if (nextZoom !== args.settings.zoom) flushSync(() => args.onZoomChange?.(nextZoom));
        const nextSettings = {
          ...args.effectiveSettings,
          zoom: Math.max(nextZoom, args.horizontalRenderZoomFloor)
        };
        restoreAcrossFrames(() => {
          if (!restoreIsCurrent(restoreVersionRef, restoreVersion)) return;
          viewport.scrollTop = scrollTop;
          viewport.scrollLeft =
            args.settings.labelWidth + TIMELINE_LEFT_GUTTER_PX + minuteToX(minute, nextSettings) - screenX;
          window.scrollTo(pageScroll.x, pageScroll.y);
        }, 3);
      });
    },
    [args, scheduleWheelZoom]
  );

  useCapturedWheel(args.containerRef, handleWheel);

  return {
    isGestureZoomActive: useCallback(() => gestureTailIsActive(gestureTailRef), [])
  };
}
