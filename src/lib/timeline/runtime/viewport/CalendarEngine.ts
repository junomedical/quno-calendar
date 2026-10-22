import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import { captureLayoutAnchor } from "#quno-internal/timeline/runtime/model/anchors";
import { clampViewport, restoreAnchor } from "#quno-internal/timeline/runtime/model/projection";
import { samePins } from "#quno-internal/timeline/runtime/model/window";
import type { Geometry, SemanticAnchor, Viewport } from "#quno-internal/timeline/runtime/model/types";
import { ViewportOwnership, type IntentKind } from "./ownership";
import { initialSnapshot, layoutGeometry, pinnedWindow, traceSnapshot } from "./initialSnapshot";
import { ZoomAnchors } from "./ZoomAnchors";

import type { EngineLayout, EngineSnapshot, EngineTrace, EngineOptions } from "./types";
export type { EngineLayout, EngineSnapshot, EngineTrace } from "./types";

/** The sole logical viewport authority. DOM writes belong to the browser commit adapter. */
export class CalendarEngine {
  readonly ownership = new ViewportOwnership();
  private listeners = new Set<() => void>();
  private snapshot: EngineSnapshot;
  private layout: EngineLayout;
  private pinnedDate?: IsoDate;
  private pinnedResources: ReadonlyMap<IsoDate, readonly string[]> = new Map();
  private trace?: (entry: EngineTrace) => void;
  private zoomAnchors = new ZoomAnchors();
  private wheel: { zoom: number; id: number } | null = null;

  constructor({ layout, viewport, trace }: EngineOptions) {
    this.layout = layout;
    this.trace = trace;
    this.snapshot = initialSnapshot({ layout, viewport });
  }

  read = (): EngineSnapshot => this.snapshot;
  subscribe = ({ listener }: { listener: () => void }) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  updateLayout({ layout, now }: { layout: EngineLayout; now: number }) {
    if (this.wheel && this.ownership.active({ now })?.id !== this.wheel.id) this.wheel = null;
    const zoomChanged = layout.settings.zoom !== this.layout.settings.zoom;
    const wheel = this.wheel;
    if (zoomChanged && wheel && wheel.zoom !== layout.settings.zoom) {
      this.ownership.cancel({ id: wheel.id });
      this.wheel = null;
    }
    if (zoomChanged && !this.wheel && this.ownership.active({ now })?.kind === "navigation") this.ownership.cancel();
    const { anchor, clamped } = this.zoomAnchors.layout({
      geometry: this.snapshot.geometry,
      viewport: this.snapshot.viewport,
      zoom: layout.settings.zoom,
      nowMinute: layout.nowMinute ?? 0,
      wheel: Boolean(this.wheel),
      now
    });
    this.layout = { ...layout, anchorDate: this.layout.anchorDate };
    this.reproject({
      geometry: this.geometry({ viewport: this.snapshot.viewport }),
      now,
      fallback: anchor,
      reason: clamped ? "zoom-clamp" : "layout"
    });
    if (zoomChanged && wheel?.zoom === layout.settings.zoom)
      queueMicrotask(() => {
        if (this.wheel === wheel) {
          this.ownership.cancel({ id: wheel.id });
          this.wheel = null;
        }
      });
  }

  expectsZoom({ zoom, now }: { zoom: number; now: number }) {
    return this.wheel?.zoom === zoom && this.ownership.active({ now })?.id === this.wheel?.id;
  }

  expectZoom({ zoom, anchor, now }: { zoom: number; anchor: SemanticAnchor; now: number }) {
    const intent = this.ownership.claim({ kind: "gesture", anchor, now, duration: 1000 });
    if (intent) this.wheel = { zoom, id: intent.id };
  }

  resize({ width, height, now }: { width: number; height: number; now: number }) {
    if (width === this.snapshot.viewport.width && height === this.snapshot.viewport.height) return;
    this.zoomAnchors.clear();
    const anchor = captureLayoutAnchor({ geometry: this.snapshot.geometry, viewport: this.snapshot.viewport });
    const viewport = { ...this.snapshot.viewport, width, height };
    this.reproject({ geometry: this.geometry({ viewport }), now, fallback: anchor, viewport, reason: "resize" });
  }

  observeScroll({ top, left, now, manual = true }: { top: number; left: number; now: number; manual?: boolean }) {
    const { viewport, geometry } = this.snapshot;
    if (Math.abs(top - viewport.top) < 0.01 && Math.abs(left - viewport.left) < 0.01) return;
    if (manual) {
      this.wheel = null;
      this.ownership.manual();
      this.zoomAnchors.clear();
    }
    this.publish({ geometry, viewport: { ...viewport, top, left }, now, reason: manual ? "scroll" : "clamp" });
  }

  position({
    anchor,
    kind,
    now,
    duration = 160,
    cancelOnManual = true
  }: {
    anchor: SemanticAnchor;
    kind: IntentKind;
    now: number;
    duration?: number;
    cancelOnManual?: boolean;
  }): number | null {
    const intent = this.ownership.claim({ kind, anchor, now, duration, cancelOnManual });
    if (!intent) return null;
    this.zoomAnchors.clear();
    if (!this.snapshot.geometry.dateIndex.has(anchor.target.dateKey))
      this.layout = { ...this.layout, anchorDate: anchor.target.dateKey };
    this.reproject({ geometry: this.geometry({ viewport: this.snapshot.viewport }), now, reason: kind });
    return intent.id;
  }

  setPins({
    date,
    resources,
    now
  }: {
    date?: IsoDate;
    resources: ReadonlyMap<IsoDate, readonly string[]>;
    now: number;
  }) {
    if (this.pinnedDate === date && samePins({ first: this.pinnedResources, second: resources })) return;
    this.pinnedDate = date;
    this.pinnedResources = resources;
    this.publish({ geometry: this.snapshot.geometry, viewport: this.snapshot.viewport, now, reason: "pins" });
  }

  cancel({ now, manual = false }: { now: number; manual?: boolean }) {
    this.zoomAnchors.cancel({
      manual,
      request: this.wheel,
      intent: this.ownership.active({ now }),
      from: this.layout.settings.zoom
    });
    this.wheel = null;
    if (manual) this.ownership.manual();
    else this.ownership.cancel();
    this.publish({
      geometry: this.snapshot.geometry,
      viewport: this.snapshot.viewport,
      now,
      reason: manual ? "manual" : "cancel"
    });
  }

  settle({ now }: { now: number }) {
    if (this.ownership.active({ now })) return;
    const anchor = captureLayoutAnchor({ geometry: this.snapshot.geometry, viewport: this.snapshot.viewport });
    if (!anchor || anchor.target.dateKey === this.layout.anchorDate) return;
    this.layout = { ...this.layout, anchorDate: anchor.target.dateKey };
    this.reproject({
      geometry: this.geometry({ viewport: this.snapshot.viewport }),
      now,
      fallback: anchor,
      reason: "recenter"
    });
  }

  private geometry({ viewport }: { viewport: Viewport }): Geometry {
    return layoutGeometry({ layout: this.layout, viewport, previous: this.snapshot?.geometry });
  }

  private reproject({
    geometry,
    now,
    fallback,
    viewport = this.snapshot.viewport,
    reason
  }: {
    geometry: Geometry;
    now: number;
    fallback?: SemanticAnchor | null;
    viewport?: Viewport;
    reason: string;
  }) {
    const anchor = this.ownership.active({ now })?.anchor ?? fallback;
    this.publish({
      geometry,
      viewport: anchor ? restoreAnchor({ geometry, anchor, viewport }) : clampViewport({ geometry, viewport }),
      now,
      reason
    });
  }

  private publish({
    geometry,
    viewport,
    now,
    reason
  }: {
    geometry: Geometry;
    viewport: Viewport;
    now: number;
    reason: string;
  }) {
    const owner = this.ownership.active({ now });
    this.snapshot = Object.freeze({
      revision: this.snapshot.revision + 1,
      reason,
      geometry,
      viewport,
      owner,
      window: pinnedWindow({ geometry, viewport, owner, date: this.pinnedDate, pinned: this.pinnedResources })
    });
    traceSnapshot({ snapshot: this.snapshot, trace: this.trace });
    for (const listener of this.listeners) listener();
  }
}
