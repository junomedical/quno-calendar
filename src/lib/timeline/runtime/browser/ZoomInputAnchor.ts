import type { CalendarEngine } from "#quno-internal/timeline/runtime/viewport/CalendarEngine";
import type { SemanticAnchor } from "#quno-internal/timeline/runtime/model/types";

/** The Shift input owns its first time point independently of controlled-request expiry and zoom limits. */
export class ZoomInputAnchor {
  private anchor: SemanticAnchor | null = null;
  private zoom: number;
  private unsubscribe: () => void;

  constructor({ engine }: { engine: CalendarEngine }) {
    this.zoom = engine.read().geometry.settings.zoom;
    this.unsubscribe = engine.subscribe({
      listener: () => {
        const state = engine.read();
        const zoom = state.geometry.settings.zoom;
        const external =
          zoom !== this.zoom && state.reason !== "zoom-clamp" && !engine.expectsZoom({ zoom, now: performance.now() });
        this.zoom = zoom;
        if (external || ["manual", "scroll", "resize", "navigation", "restore"].includes(state.reason)) this.clear();
      }
    });
  }

  isHeld() {
    return this.anchor !== null;
  }

  hold({ capture }: { capture: () => SemanticAnchor | null }): SemanticAnchor | null {
    return (this.anchor ??= capture());
  }

  clear() {
    this.anchor = null;
  }

  dispose() {
    this.unsubscribe();
    this.clear();
  }
}
