/**
 * Viewport read scheduler.
 *
 * native scroll/resize -> one animation-frame read -> immutable snapshot
 *                                             `-> local resource subscribers
 *
 * Keeping this outside the view coordinator prevents scroll from rerendering
 * the full calendar tree. Only mounted date sections subscribe.
 */
import { useLayoutEffect, useMemo, useSyncExternalStore, type RefObject } from "react";

export type ViewportMetrics = {
  scrollTop: number;
  scrollLeft: number;
  width: number;
  height: number;
};

const EMPTY_METRICS: ViewportMetrics = Object.freeze({ scrollTop: 0, scrollLeft: 0, width: 0, height: 0 });

export class ViewportMetricsStore {
  private element: HTMLElement | null = null;
  private snapshot: ViewportMetrics = EMPTY_METRICS;
  private readonly listeners = new Set<() => void>();
  private frame: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  readonly getSnapshot = () => this.snapshot;
  readonly getServerSnapshot = () => EMPTY_METRICS;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  attach(element: HTMLElement | null) {
    if (element === this.element) return () => this.detach();
    this.detach();
    this.element = element;
    if (!element) return () => this.detach();
    element.addEventListener("scroll", this.schedule, { passive: true });
    this.resizeObserver = new ResizeObserver(this.schedule);
    this.resizeObserver.observe(element);
    this.read();
    return () => this.detach();
  }

  private readonly schedule = () => {
    if (this.frame !== null) return;
    this.frame = window.requestAnimationFrame(() => {
      this.frame = null;
      this.read();
    });
  };

  private read() {
    const element = this.element;
    if (!element) return;
    const next = {
      scrollTop: element.scrollTop,
      scrollLeft: element.scrollLeft,
      width: element.clientWidth,
      height: element.clientHeight
    };
    if (
      next.scrollTop === this.snapshot.scrollTop &&
      next.scrollLeft === this.snapshot.scrollLeft &&
      next.width === this.snapshot.width &&
      next.height === this.snapshot.height
    ) {
      return;
    }
    this.snapshot = next;
    for (const listener of this.listeners) listener();
  }

  private detach() {
    if (this.frame !== null) window.cancelAnimationFrame(this.frame);
    this.frame = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.element?.removeEventListener("scroll", this.schedule);
    this.element = null;
  }
}

export function useViewportMetricsStore(containerRef: RefObject<HTMLElement | null>) {
  const store = useMemo(() => new ViewportMetricsStore(), []);
  useLayoutEffect(() => store.attach(containerRef.current), [containerRef, store]);
  return store;
}

export function useViewportMetrics(store: ViewportMetricsStore) {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}
