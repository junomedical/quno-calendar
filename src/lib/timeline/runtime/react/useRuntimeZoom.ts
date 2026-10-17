import { useEffect, useRef, type RefObject } from "react";
import type { CalendarInternalViewProps } from "#quno-internal/timeline/core/internalTypes";
import type { CalendarEngine } from "#quno-internal/timeline/runtime/viewport/CalendarEngine";
import { wheelAnchor } from "#quno-internal/timeline/runtime/viewport/zoomAnchor";
import type { ViewportAdapter } from "#quno-internal/timeline/runtime/browser/ViewportAdapter";
import type { SemanticAnchor } from "#quno-internal/timeline/runtime/model/types";

export function useRuntimeZoom({
  engine,
  adapter,
  containerRef,
  onZoomChange
}: {
  engine: CalendarEngine;
  adapter?: Pick<ViewportAdapter, "flush">;
  containerRef: RefObject<HTMLDivElement | null>;
  onZoomChange: CalendarInternalViewProps["onZoomChange"];
}) {
  const callback = useRef(onZoomChange);
  callback.current = onZoomChange;
  useEffect(() => {
    const viewport = containerRef.current;
    if (!viewport) return;
    let frame: number | null = null;
    let anchor: SemanticAnchor | null = null;
    let tail = 0;
    let requested: number | null = null;
    let lastRequested: number | null = null;
    let observedZoom = engine.read().geometry.settings.zoom;
    let requestedAt = 0;
    let active = true;
    const handle = (event: WheelEvent) => {
      if (!callback.current) return;
      const now = performance.now();
      const state = engine.read();
      if (state.geometry.settings.zoom !== observedZoom) {
        observedZoom = state.geometry.settings.zoom;
        if (observedZoom !== lastRequested) {
          anchor = null;
          tail = 0;
          requested = null;
        }
        lastRequested = null;
      }
      if (now - requestedAt > 1000) lastRequested = null;
      if (!event.shiftKey) {
        if (now < tail) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }
      const continuing = now < tail;
      if (!continuing) anchor = null;
      event.preventDefault();
      event.stopPropagation();
      tail = now + 300;
      const delta = event.deltaY || event.deltaX;
      if (!delta) return;
      const zoom = Math.max(
        0.5,
        Math.min(
          8,
          Number(((requested ?? lastRequested ?? state.geometry.settings.zoom) + (delta < 0 ? 0.15 : -0.15)).toFixed(2))
        )
      );
      if (zoom === state.geometry.settings.zoom && requested === null) return;
      if (!anchor || !continuing) {
        const box = viewport.getBoundingClientRect();
        anchor = wheelAnchor({
          geometry: state.geometry,
          viewport: { ...state.viewport, top: viewport.scrollTop, left: viewport.scrollLeft },
          pointer: { x: event.clientX - box.left, y: event.clientY - box.top }
        });
      }
      if (!anchor) return;
      requested = zoom;
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const next = requested;
        requested = null;
        const captured = anchor;
        queueMicrotask(() => {
          if (!active || next === null || !captured) return;
          const committedZoom = engine.read().geometry.settings.zoom;
          if (committedZoom !== observedZoom && committedZoom !== lastRequested) {
            observedZoom = committedZoom;
            lastRequested = null;
            anchor = null;
            tail = 0;
            return;
          }
          observedZoom = committedZoom;
          lastRequested = next;
          requestedAt = performance.now();
          adapter?.flush();
          engine.expectZoom({ zoom: next, anchor: captured, now: performance.now() });
          callback.current?.({ zoom: next });
        });
      });
    };
    const handleTouch = (event: TouchEvent) => {
      if (!callback.current || !event.shiftKey) return;
      event.preventDefault();
      event.stopPropagation();
      tail = performance.now() + 300;
    };
    viewport.addEventListener("wheel", handle, { passive: false });
    viewport.addEventListener("touchmove", handleTouch, { passive: false });
    return () => {
      active = false;
      if (frame !== null) cancelAnimationFrame(frame);
      viewport.removeEventListener("wheel", handle);
      viewport.removeEventListener("touchmove", handleTouch);
    };
  }, [adapter, containerRef, engine]);
}
