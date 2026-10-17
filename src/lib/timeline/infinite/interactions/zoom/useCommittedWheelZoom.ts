import { useCallback, useLayoutEffect, useRef } from "react";
import {
  captureWheelEvent,
  extendGestureTail,
  gestureTailIsActive,
  nextZoomFromWheel,
  useCapturedWheel,
  useFrameCoalescedWheelZoom,
  type SharedZoomArgs
} from "./shiftWheelZoomUtils";

type CommittedWheelZoomArgs<Anchor> = SharedZoomArgs & {
  layoutKey?: string;
  captureAnchor: (args: { viewport: HTMLDivElement; event: WheelEvent; active: Anchor | null }) => Anchor | null;
  restoreAnchor: (args: { viewport: HTMLDivElement; anchor: Anchor }) => void;
  beforeWheel?: () => void;
};

/** One controlled request per frame; final geometry and focus are restored together before paint. */
export function useCommittedWheelZoom<Anchor>(args: CommittedWheelZoomArgs<Anchor>) {
  const gestureTailRef = useRef(0);
  const anchorRef = useRef<Anchor | null>(null);
  const pendingRef = useRef<{ zoom: number; anchor: Anchor } | null>(null);
  const committedRef = useRef<{ zoom: number; anchor: Anchor; layoutKey?: string } | null>(null);
  const previousZoomRef = useRef(args.settings.zoom);
  const latestArgsRef = useRef(args);
  latestArgsRef.current = args;
  const scheduleWheelZoom = useFrameCoalescedWheelZoom({ controlledZoom: args.settings.zoom });

  useLayoutEffect(() => {
    if (previousZoomRef.current !== args.settings.zoom) {
      previousZoomRef.current = args.settings.zoom;
      if (pendingRef.current?.zoom === args.settings.zoom) {
        committedRef.current = { ...pendingRef.current };
      } else {
        gestureTailRef.current = 0;
        anchorRef.current = null;
        committedRef.current = null;
      }
      pendingRef.current = null;
    }
    const committed = committedRef.current;
    const layoutKey = `${args.settings.zoom}:${args.layoutKey ?? ""}`;
    const viewport = args.containerRef.current;
    if (!committed || !viewport || committed.layoutKey === layoutKey) return;
    committed.layoutKey = layoutKey;
    args.restoreAnchor({ viewport, anchor: committed.anchor });
    // Structural date-model changes can commit synchronously again before paint.
    // Retain ownership for those commits, then release without scheduling scroll retries.
    queueMicrotask(() => {
      if (committedRef.current === committed) committedRef.current = null;
    });
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
          pendingRef.current = null;
          committedRef.current = null;
        }
        return;
      }
      const viewport = args.containerRef.current;
      if (!viewport || nextZoomFromWheel({ settings: args.settings, event }) === null) return;
      const anchor = args.captureAnchor({
        viewport,
        event,
        active: gestureTailIsActive(gestureTailRef) ? anchorRef.current : null
      });
      if (!anchor) return;
      args.beforeWheel?.();
      args.clearScrollEndTimer();
      captureWheelEvent(event);
      anchorRef.current = anchor;
      extendGestureTail(gestureTailRef);
      scheduleWheelZoom({
        settings: args.settings,
        event,
        commit: ({ zoom }) => {
          queueMicrotask(() => {
            const latest = latestArgsRef.current;
            if (anchorRef.current !== anchor || latest.settings.zoom !== args.settings.zoom) return;
            if (zoom === latest.settings.zoom) return;
            pendingRef.current = { zoom, anchor };
            latest.onZoomChange?.({ zoom });
          });
        }
      });
    },
    [args, scheduleWheelZoom]
  );

  useCapturedWheel({ ref: args.containerRef, listener: handleWheel });
  return {
    isGestureZoomActive: useCallback(() => Boolean(committedRef.current) || gestureTailIsActive(gestureTailRef), [])
  };
}
