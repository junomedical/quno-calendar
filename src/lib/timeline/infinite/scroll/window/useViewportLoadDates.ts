/**
 * Committed viewport geometry -> settled load dates, independent of render overscan.
 * Buffered reads share this settling gate; cached dates remain available while
 * navigation or layout correction is still in progress.
 * @see docs/infinite-calendar/flows/async-loading-and-layout.md
 */
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { semanticDateKeyForRenderItem, type VirtualDateRenderItem } from "./renderItems";

type ViewportLoadDatesArgs = {
  containerRef: RefObject<HTMLElement | null>;
  renderItems: VirtualDateRenderItem[];
  dateKeyForIndex: (args: { index: number }) => string;
  topInset: number;
  retainWindow?: boolean;
  isScrolling: boolean;
};

// Native scrollend may fire between individual mouse-wheel steps.
const WHEEL_IDLE_DELAY_MS = 100;

type SettledViewport = { dateKeys: string[]; generation: number };

export function useViewportLoadDates(args: ViewportLoadDatesArgs) {
  const latest = useRef(args);
  latest.current = args;
  const generation = useRef(0);
  const ready = useRef<SettledViewport | null>(null);
  const wheelActive = useRef(false);
  const [snapshot, setSnapshot] = useState<SettledViewport>({ dateKeys: [], generation: -1 });
  const scheduleRef = useRef<(() => void) | null>(null);
  const canLoad = useCallback(
    () => ready.current === snapshot && !latest.current.isScrolling && !latest.current.retainWindow,
    [snapshot]
  );

  useLayoutEffect(() => {
    const viewport = args.containerRef.current;
    if (!viewport) {
      return;
    }
    let wheelTimer = 0;
    let layoutFrame = 0;
    let settledFrame = 0;
    const invalidate = () => {
      generation.current += 1;
      ready.current = null;
      window.cancelAnimationFrame(layoutFrame);
      window.cancelAnimationFrame(settledFrame);
    };
    const schedule = () => {
      invalidate();
      if (wheelActive.current || latest.current.isScrolling || latest.current.retainWindow) {
        return;
      }
      const scheduledGeneration = generation.current;
      // Let navigation/restoration writes and their measurements commit first.
      layoutFrame = window.requestAnimationFrame(() => {
        settledFrame = window.requestAnimationFrame(() => {
          const { renderItems, dateKeyForIndex, topInset, retainWindow, isScrolling } = latest.current;
          if (wheelActive.current || retainWindow || isScrolling || generation.current !== scheduledGeneration) {
            return;
          }
          const top = viewport.scrollTop + topInset;
          const bottom = viewport.scrollTop + viewport.clientHeight;
          const next = [
            ...new Set(
              renderItems
                .filter((item) => item.start + item.size > top && item.start < bottom)
                .map((item) => semanticDateKeyForRenderItem({ item, dateKeyForIndex }))
            )
          ].sort();
          if (next.length) {
            setSnapshot((previous) => ({
              dateKeys:
                previous.dateKeys.length === next.length &&
                previous.dateKeys.every((date, index) => date === next[index])
                  ? previous.dateKeys
                  : next,
              generation: scheduledGeneration
            }));
          }
        });
      });
    };
    const onWheel = () => {
      wheelActive.current = true;
      invalidate();
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => {
        wheelActive.current = false;
        schedule();
      }, WHEEL_IDLE_DELAY_MS);
    };
    scheduleRef.current = schedule;
    viewport.addEventListener("wheel", onWheel, { passive: true });
    viewport.addEventListener("scroll", schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(viewport);
    schedule();
    return () => {
      invalidate();
      wheelActive.current = false;
      window.clearTimeout(wheelTimer);
      scheduleRef.current = null;
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("scroll", schedule);
      observer.disconnect();
    };
  }, [args.containerRef]);

  useLayoutEffect(
    () => scheduleRef.current?.(),
    [args.renderItems, args.dateKeyForIndex, args.topInset, args.retainWindow, args.isScrolling]
  );
  // Publish readiness only after the matching geometry snapshot commits.
  useLayoutEffect(() => {
    if (snapshot.generation === generation.current && snapshot.dateKeys.length) {
      ready.current = snapshot;
    }
  }, [snapshot]);

  return useMemo(() => ({ dateKeys: snapshot.dateKeys, canLoad }), [snapshot, canLoad]);
}
