import { captureLayoutAnchor } from "#quno-internal/timeline/runtime/model/anchors";
import type { Geometry, SemanticAnchor, Viewport } from "#quno-internal/timeline/runtime/model/types";
import type { ViewportIntent } from "./ownership";
import { externalZoomAnchor } from "./zoomAnchor";

type Rejected = { from: number; to: number; anchor: SemanticAnchor; expiresAt: number };

/** Keeps external zoom focus separate from a cancelled request's bounded parent acknowledgement. */
export class ZoomAnchors {
  private external: SemanticAnchor | null = null;
  private rejected: Rejected | null = null;

  clear() {
    this.external = this.rejected = null;
  }

  cancel({
    manual,
    request,
    intent,
    from
  }: {
    manual: boolean;
    request: { zoom: number; id: number } | null;
    intent: ViewportIntent | null;
    from: number;
  }) {
    this.clear();
    if (!manual && request && intent?.id === request.id)
      this.rejected = { from, to: request.zoom, anchor: intent.anchor, expiresAt: intent.expiresAt };
  }

  layout({
    geometry,
    viewport,
    zoom,
    nowMinute,
    wheel,
    now
  }: {
    geometry: Geometry;
    viewport: Viewport;
    zoom: number;
    nowMinute: number;
    wheel: boolean;
    now: number;
  }) {
    const changed = zoom !== geometry.settings.zoom;
    const rejected = this.rejected;
    if (changed) this.rejected = null;
    // A value between the old scale and its explicitly cancelled request is the parent's clamped acceptance.
    const clamped = Boolean(
      changed &&
      rejected &&
      now < rejected.expiresAt &&
      zoom >= Math.min(rejected.from, rejected.to) &&
      zoom <= Math.max(rejected.from, rejected.to)
    );
    if (clamped) return { anchor: rejected!.anchor, clamped };
    if (wheel) this.external = null;
    const anchor = changed
      ? (this.external ??= externalZoomAnchor({ geometry, viewport, nowMinute }))
      : captureLayoutAnchor({ geometry, viewport });
    if (wheel) this.external = null;
    return { anchor, clamped: false };
  }
}
