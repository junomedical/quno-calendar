import { useCallback, useLayoutEffect, useRef } from "react";
import type { QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import {
  captureHorizontalWheelAnchor,
  restoreHorizontalWheelAnchor,
  type HorizontalWheelAnchor
} from "./horizontalWheelAnchor";
import {
  captureWheelEvent,
  extendGestureTail,
  gestureTailIsActive,
  nextZoomFromWheel,
  useCapturedWheel,
  useFrameCoalescedWheelZoom,
  type SharedZoomArgs
} from "./shiftWheelZoomUtils";

type HorizontalZoomArgs = SharedZoomArgs & { effectiveSettings: QunoInfiniteCalendarSettings };

/** Keeps the first focused time node fixed in the committed horizontal layout, before paint. */
export function useHorizontalShiftWheelZoom(args: HorizontalZoomArgs) {
  const gestureTailRef = useRef(0);
  const anchorRef = useRef<HorizontalWheelAnchor | null>(null);
  const pendingZoomRef = useRef<number | null>(null);
  const previousZoomRef = useRef(args.settings.zoom);
  const latestArgsRef = useRef(args);
  latestArgsRef.current = args;
  const scheduleWheelZoom = useFrameCoalescedWheelZoom({ controlledZoom: args.settings.zoom });

  useLayoutEffect(() => {
    if (previousZoomRef.current === args.settings.zoom) return;
    previousZoomRef.current = args.settings.zoom;
    const viewport = args.containerRef.current;
    const anchor = anchorRef.current;
    if (pendingZoomRef.current === args.settings.zoom && viewport && anchor) {
      restoreHorizontalWheelAnchor({ viewport, anchor, settings: args.effectiveSettings });
    } else {
      // An external controlled change owns its own anchor, including during the gesture tail.
      gestureTailRef.current = 0;
      anchorRef.current = null;
    }
    pendingZoomRef.current = null;
  });

  useLayoutEffect(
    () => () => {
      anchorRef.current = null;
    },
    []
  );

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (!args.onZoomChange) return;
      if (!event.shiftKey) {
        if (gestureTailIsActive(gestureTailRef)) {
          args.clearScrollEndTimer();
          captureWheelEvent(event);
        } else {
          anchorRef.current = null;
          pendingZoomRef.current = null;
        }
        return;
      }

      const viewport = args.containerRef.current;
      if (!viewport || nextZoomFromWheel({ settings: args.settings, event }) === null) return;
      const anchor =
        (gestureTailIsActive(gestureTailRef) ? anchorRef.current : null) ??
        captureHorizontalWheelAnchor({ viewport, event, settings: args.effectiveSettings });
      anchor.scrollTop = viewport.scrollTop;
      anchor.pageX = window.scrollX;
      anchor.pageY = window.scrollY;
      args.clearScrollEndTimer();
      captureWheelEvent(event);
      anchorRef.current = anchor;
      extendGestureTail(gestureTailRef);
      scheduleWheelZoom({
        settings: args.settings,
        event,
        commit: ({ zoom }) => {
          // Parent state may commit later. Never apply predicted geometry to the old DOM.
          queueMicrotask(() => {
            const latest = latestArgsRef.current;
            if (anchorRef.current !== anchor || latest.settings.zoom !== args.settings.zoom) return;
            if (zoom === latest.settings.zoom) return;
            pendingZoomRef.current = zoom;
            latest.onZoomChange?.({ zoom });
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
