import type { CalendarEngine, EngineSnapshot } from "#quno-internal/timeline/runtime/viewport/CalendarEngine";
import { scrollRecenterDelayMs } from "#quno-internal/timeline/infinite/scroll/scrollConstants";

/** Native input observations are batched; only commit writes a programmatic viewport position. */
export class ViewportAdapter {
  private viewport: HTMLElement | null = null;
  private pending: { top: number; left: number } | null = null;
  private frame: number | null = null;
  private idle: ReturnType<typeof setTimeout> | null = null;
  private observer: ResizeObserver | null = null;
  private committedRevision = -1;

  constructor(private readonly engine: CalendarEngine) {}

  attach({ viewport }: { viewport: HTMLElement }) {
    this.detach();
    this.viewport = viewport;
    viewport.addEventListener("scroll", this.onScroll, { passive: true });
    viewport.addEventListener("scrollend", this.onScroll, { passive: true });
    viewport.addEventListener("wheel", this.onIntent, { passive: true, capture: true });
    viewport.addEventListener("pointerdown", this.onIntent, { passive: true, capture: true });
    viewport.addEventListener("touchmove", this.onIntent, { passive: true, capture: true });
    viewport.addEventListener("keydown", this.onKey);
    this.observer = new ResizeObserver(this.onResize);
    this.observer.observe(viewport);
    this.onResize();
    return () => this.detach();
  }

  commit({ snapshot }: { snapshot: EngineSnapshot }) {
    const viewport = this.viewport;
    if (!viewport || snapshot.revision !== this.engine.read().revision || snapshot.revision === this.committedRevision)
      return;
    this.committedRevision = snapshot.revision;
    // A committed position supersedes native observations captured against the previous DOM.
    this.pending = null;
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    if (Math.abs(viewport.scrollTop - snapshot.viewport.top) > 0.01) viewport.scrollTop = snapshot.viewport.top;
    if (Math.abs(viewport.scrollLeft - snapshot.viewport.left) > 0.01) viewport.scrollLeft = snapshot.viewport.left;
    // A browser clamp is observed once against the committed spacer, never retried with stale geometry.
    this.engine.observeScroll({
      top: viewport.scrollTop,
      left: viewport.scrollLeft,
      now: performance.now(),
      manual: false
    });
  }

  /** Native event positions were read before React's DOM mutations. */
  flushPending() {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    const pending = this.pending;
    this.pending = null;
    if (pending) this.engine.observeScroll({ ...pending, now: performance.now() });
  }

  flush() {
    this.pending = null;
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    const viewport = this.viewport;
    if (viewport)
      this.engine.observeScroll({ top: viewport.scrollTop, left: viewport.scrollLeft, now: performance.now() });
  }

  detach() {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    if (this.idle !== null) clearTimeout(this.idle);
    this.frame = null;
    this.pending = null;
    this.idle = null;
    this.observer?.disconnect();
    const viewport = this.viewport;
    viewport?.removeEventListener("scroll", this.onScroll);
    viewport?.removeEventListener("scrollend", this.onScroll);
    viewport?.removeEventListener("wheel", this.onIntent, true);
    viewport?.removeEventListener("pointerdown", this.onIntent, true);
    viewport?.removeEventListener("touchmove", this.onIntent, true);
    viewport?.removeEventListener("keydown", this.onKey);
    this.viewport = null;
    this.committedRevision = -1;
  }

  private onResize = () => {
    if (this.viewport)
      this.engine.resize({
        width: this.viewport.clientWidth,
        height: this.viewport.clientHeight,
        now: performance.now()
      });
  };
  private onScroll = () => {
    if (this.viewport) this.pending = { top: this.viewport.scrollTop, left: this.viewport.scrollLeft };
    if (this.frame === null) this.frame = requestAnimationFrame(() => this.flushPending());
    if (this.idle !== null) clearTimeout(this.idle);
    this.idle = setTimeout(
      () => {
        this.idle = null;
        this.flush();
        this.engine.settle({ now: performance.now() });
      },
      this.viewport ? scrollRecenterDelayMs(this.viewport) : 1200
    );
  };
  private onIntent: EventListener = (event) => {
    if (event instanceof WheelEvent) {
      if (!event.shiftKey)
        queueMicrotask(() => {
          if (!event.defaultPrevented) this.manualIntent();
        });
      return;
    }
    if (event.type === "touchmove" && (event as TouchEvent).shiftKey) return;
    this.manualIntent();
  };
  private manualIntent = () => {
    if (this.idle !== null) clearTimeout(this.idle);
    this.idle = null;
    this.flush();
    this.engine.cancel({ now: performance.now(), manual: true });
    this.onScroll();
  };
  private onKey: EventListener = (event) => {
    if (
      event instanceof KeyboardEvent &&
      ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)
    )
      this.onIntent(event);
  };
}
