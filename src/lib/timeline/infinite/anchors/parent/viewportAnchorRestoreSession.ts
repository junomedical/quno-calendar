/**
 * One cancellable viewport-anchor restoration session.
 *
 * registry/layout notifications -> one rAF read/write -> corrected scroll
 * manual intent or deadline ---------------------------> cleanup
 */
import type {
  QunoInfiniteCalendarHandle,
  CalendarViewportAnchor,
  CalendarViewportAnchorRestoreOptions,
  CalendarViewportAnchorTarget
} from "#quno-internal/timeline/core/types";
import type { ViewportGeometryRegistry } from "./viewportGeometryRegistry";

const MANUAL_SCROLL_KEYS = new Set([
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "End",
  "Home",
  "PageDown",
  "PageUp",
  " "
]);

type RestoreSessionArgs = {
  viewport: HTMLElement;
  anchor: CalendarViewportAnchor;
  target: CalendarViewportAnchorTarget;
  options: CalendarViewportAnchorRestoreOptions;
  registry: ViewportGeometryRegistry;
  resolveSnapshot: (target: CalendarViewportAnchorTarget) => CalendarViewportAnchor["snapshot"] | null;
  scrollToDateTime: QunoInfiniteCalendarHandle["scrollToDateTime"];
  isCurrent: () => boolean;
  cancel: () => void;
};

export class ViewportAnchorRestoreSession {
  private frame: number | null = null;
  private deadline: number | null = null;
  private fallbackUsed = false;
  private userIntent = false;
  private expectedScroll: { top: number; left: number } | null = null;
  private lastScroll: { top: number; left: number };
  private observer: MutationObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(private readonly args: RestoreSessionArgs) {
    this.lastScroll = { top: args.viewport.scrollTop, left: args.viewport.scrollLeft };
  }

  start() {
    const { viewport, registry, options } = this.args;
    this.observer = new MutationObserver(this.schedule);
    this.observer.observe(viewport, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ["class", "style"]
    });
    this.resizeObserver = new ResizeObserver(this.schedule);
    this.resizeObserver.observe(viewport);
    this.unsubscribe = registry.subscribe(this.schedule);
    viewport.addEventListener("scroll", this.handleScroll, { passive: true });
    viewport.addEventListener("pointerdown", this.markIntent, { passive: true });
    window.addEventListener("wheel", this.markIntent, { passive: true, capture: true });
    window.addEventListener("touchmove", this.markIntent, { passive: true, capture: true });
    window.addEventListener("keydown", this.handleKey);
    this.deadline = window.setTimeout(this.args.cancel, options.afterRecenter ? 2_800 : 160);
    this.apply();
    this.schedule();
    return this.cleanup;
  }

  readonly cleanup = () => {
    if (this.frame !== null) window.cancelAnimationFrame(this.frame);
    if (this.deadline !== null) window.clearTimeout(this.deadline);
    this.frame = null;
    this.deadline = null;
    this.observer?.disconnect();
    this.resizeObserver?.disconnect();
    this.unsubscribe?.();
    this.observer = null;
    this.resizeObserver = null;
    this.unsubscribe = null;
    const { viewport } = this.args;
    viewport.removeEventListener("scroll", this.handleScroll);
    viewport.removeEventListener("pointerdown", this.markIntent);
    window.removeEventListener("wheel", this.markIntent, true);
    window.removeEventListener("touchmove", this.markIntent, true);
    window.removeEventListener("keydown", this.handleKey);
  };

  private readonly schedule = () => {
    if (!this.args.isCurrent() || this.frame !== null) return;
    this.frame = window.requestAnimationFrame(this.apply);
  };

  private readonly apply = () => {
    this.frame = null;
    if (!this.args.isCurrent()) return;
    const snapshot = this.args.resolveSnapshot(this.args.target);
    if (!snapshot) {
      this.useNavigationFallback();
      return;
    }
    const { viewport, anchor } = this.args;
    const next = {
      top: viewport.scrollTop + snapshot.top - anchor.snapshot.top,
      left: viewport.scrollLeft + snapshot.left - anchor.snapshot.left
    };
    if (Math.abs(next.top - viewport.scrollTop) <= 0.5 && Math.abs(next.left - viewport.scrollLeft) <= 0.5) return;
    this.expectedScroll = next;
    viewport.scrollTop = next.top;
    viewport.scrollLeft = next.left;
  };

  private useNavigationFallback() {
    const { options, scrollToDateTime, target } = this.args;
    if (this.fallbackUsed || options.allowNavigationFallback === false || !target.dateKey || !target.time) return;
    this.fallbackUsed = true;
    scrollToDateTime(target.dateKey, target.time);
  }

  private readonly markIntent = () => {
    this.userIntent = true;
    if (this.args.options.cancelOnManualScroll) this.args.cancel();
  };

  private readonly handleKey = (event: KeyboardEvent) => {
    if (MANUAL_SCROLL_KEYS.has(event.key)) this.markIntent();
  };

  private readonly handleScroll = () => {
    const { viewport, options } = this.args;
    if (
      this.expectedScroll &&
      Math.abs(viewport.scrollTop - this.expectedScroll.top) <= 1 &&
      Math.abs(viewport.scrollLeft - this.expectedScroll.left) <= 1
    ) {
      this.expectedScroll = null;
      this.lastScroll = { top: viewport.scrollTop, left: viewport.scrollLeft };
      return;
    }
    const moved =
      Math.abs(viewport.scrollTop - this.lastScroll.top) > 1 ||
      Math.abs(viewport.scrollLeft - this.lastScroll.left) > 1;
    this.lastScroll = { top: viewport.scrollTop, left: viewport.scrollLeft };
    if (moved && this.userIntent && options.cancelOnManualScroll) this.args.cancel();
  };
}
