import type { CalendarEngine, EngineSnapshot } from "#quno-internal/timeline/runtime/viewport/CalendarEngine";
import type { SemanticAnchor } from "#quno-internal/timeline/runtime/model/types";
import type { ViewportAdapter } from "./ViewportAdapter";

type Options = {
  engine: CalendarEngine;
  adapter: Pick<ViewportAdapter, "flush" | "subscribeCommit">;
  request: (input: { zoom: number }) => void;
  cancel: () => void;
};

/** One controlled request may await DOM/scroll commit; newer samples replace one accumulated target. */
export class ZoomCommitCoordinator {
  private target: number | null = null;
  private anchor: SemanticAnchor | null = null;
  private waiting: { zoom: number; revision: number } | null = null;
  private frame: number | null = null;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private generation = 0;
  private observed: number;
  private flushing = false;
  private unsubscribe: () => void;
  private uncommit: () => void;

  constructor(private readonly options: Options) {
    this.observed = options.engine.read().geometry.settings.zoom;
    this.unsubscribe = options.engine.subscribe({ listener: () => this.observe() });
    this.uncommit = options.adapter.subscribeCommit({ listener: (snapshot) => this.committed(snapshot) });
  }

  add({ delta, continuing, capture }: { delta: number; continuing: boolean; capture: () => SemanticAnchor | null }) {
    if (!delta) return;
    if (!continuing && !this.waiting) {
      this.target = null;
      this.anchor = null;
    }
    const current = this.options.engine.read().geometry.settings.zoom;
    const next = Math.max(0.5, Math.min(8, Number(((this.target ?? current) + (delta < 0 ? 0.2 : -0.2)).toFixed(2))));
    if (next === current && this.target === null) return;
    this.anchor ??= capture();
    if (!this.anchor) return;
    this.target = next;
    this.schedule();
  }

  dispose() {
    this.unsubscribe();
    this.uncommit();
    this.reset();
  }

  private reset({ releaseInput = true } = {}) {
    this.generation += 1;
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    if (this.timeout !== null) clearTimeout(this.timeout);
    this.frame = this.timeout = null;
    this.waiting = null;
    this.target = null;
    this.anchor = null;
    if (releaseInput) this.options.cancel();
  }

  private observe() {
    if (this.flushing) return;
    const snapshot = this.options.engine.read();
    const zoom = snapshot.geometry.settings.zoom;
    const external = zoom !== this.observed && zoom !== this.waiting?.zoom;
    this.observed = zoom;
    if (external || ["cancel", "manual", "navigation", "restore", "scroll", "resize"].includes(snapshot.reason))
      this.reset();
  }

  private committed(snapshot: EngineSnapshot) {
    if (
      !this.waiting ||
      snapshot.revision <= this.waiting.revision ||
      snapshot.geometry.settings.zoom !== this.waiting.zoom
    )
      return;
    if (this.timeout !== null) clearTimeout(this.timeout);
    this.timeout = null;
    this.waiting = null;
    this.schedule();
  }

  private schedule() {
    if (this.waiting || this.frame !== null || this.target === this.options.engine.read().geometry.settings.zoom)
      return;
    const generation = this.generation;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      // Controlled callbacks must remain outside React's current render/commit work.
      queueMicrotask(() => {
        if (generation === this.generation) this.send();
      });
    });
  }

  private send() {
    const { engine, adapter, request } = this.options;
    const zoom = this.target;
    if (this.waiting || zoom === null || !this.anchor || zoom === engine.read().geometry.settings.zoom) return;
    this.flushing = true;
    adapter.flush();
    this.flushing = false;
    engine.expectZoom({ zoom, anchor: this.anchor, now: performance.now() });
    this.waiting = { zoom, revision: engine.read().revision };
    // Request expiry drops zoom intent; an active momentum stream still belongs to the input handler.
    this.timeout = setTimeout(() => this.reset({ releaseInput: false }), 1000);
    request({ zoom });
  }
}
