/**
 * Committed viewport geometry -> settled load dates, independent of render overscan.
 * Keep the last useful window through structural corrections. Fast scrolling
 * coalesces reads; mounting a pinned editor date does not expand the viewport.
 * @see docs/infinite-calendar/flows/async-loading-and-layout.md
 */
import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { semanticDateKeyForRenderItem, type VirtualDateRenderItem } from "./renderItems";

type ViewportLoadDatesArgs = {
  containerRef: RefObject<HTMLElement | null>;
  renderItems: VirtualDateRenderItem[];
  dateKeyForIndex: (args: { index: number }) => string;
  topInset: number;
  retainWindow?: boolean;
};

export function useViewportLoadDates(args: ViewportLoadDatesArgs) {
  const latest = useRef(args);
  latest.current = args;
  const [dates, setDates] = useState<string[]>([]);
  const scheduleRef = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    const viewport = args.containerRef.current;
    if (!viewport) return;
    let timer = 0;
    let frame = 0;
    const schedule = () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
      timer = window.setTimeout(() => {
        frame = window.requestAnimationFrame(() => {
          const { renderItems, dateKeyForIndex, topInset, retainWindow } = latest.current;
          if (retainWindow) return;
          const top = viewport.scrollTop + topInset;
          const bottom = viewport.scrollTop + viewport.clientHeight;
          const next = [
            ...new Set(
              renderItems
                .filter((item) => item.start + item.size > top && item.start < bottom)
                .map((item) => semanticDateKeyForRenderItem({ item, dateKeyForIndex }))
            )
          ].sort();
          if (next.length)
            setDates((previous) =>
              previous.length === next.length && previous.every((date, index) => date === next[index]) ? previous : next
            );
        });
      }, 100);
    };
    scheduleRef.current = schedule;
    viewport.addEventListener("scroll", schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(viewport);
    schedule();
    return () => {
      scheduleRef.current = null;
      viewport.removeEventListener("scroll", schedule);
      observer.disconnect();
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
    };
  }, [args.containerRef]);

  useLayoutEffect(
    () => scheduleRef.current?.(),
    [args.renderItems, args.dateKeyForIndex, args.topInset, args.retainWindow]
  );
  return dates;
}
