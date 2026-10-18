import { useEffect, useRef, type RefObject } from "react";
import type { CalendarInternalViewProps } from "#quno-internal/timeline/core/internalTypes";
import type { CalendarEngine } from "#quno-internal/timeline/runtime/viewport/CalendarEngine";
import { wheelAnchor } from "#quno-internal/timeline/runtime/viewport/zoomAnchor";
import type { ViewportAdapter } from "#quno-internal/timeline/runtime/browser/ViewportAdapter";
import { ZoomScrollLock } from "#quno-internal/timeline/runtime/browser/ZoomScrollLock";
import { ZoomCommitCoordinator } from "#quno-internal/timeline/runtime/browser/ZoomCommitCoordinator";

export function useRuntimeZoom({
  engine,
  adapter,
  containerRef,
  onZoomChange
}: {
  engine: CalendarEngine;
  adapter: Pick<ViewportAdapter, "flush" | "subscribeCommit">;
  containerRef: RefObject<HTMLDivElement | null>;
  onZoomChange: CalendarInternalViewProps["onZoomChange"];
}) {
  const callback = useRef(onZoomChange);
  callback.current = onZoomChange;
  const enabled = Boolean(onZoomChange);
  useEffect(() => {
    const viewport = containerRef.current;
    if (!viewport || !enabled) return;
    const scrollLock = new ZoomScrollLock({ viewport });
    let tail = 0;
    let mode: "scroll" | "zoom" | null = null;
    const coordinator = new ZoomCommitCoordinator({
      engine,
      adapter,
      request: (input) => callback.current?.(input),
      cancel: () => {
        // Native scrolling publishes viewport updates; those must not reset its input-mode latch.
        if (mode === "zoom") {
          tail = 0;
          mode = null;
        }
        scrollLock.release();
      }
    });
    const handle = (event: WheelEvent) => {
      if (!callback.current) return;
      const now = performance.now();
      const continuing = now < tail && mode === "zoom";
      if (now >= tail || mode === null) mode = event.shiftKey ? "zoom" : "scroll";
      tail = now + 300;
      if (mode === "scroll") return;
      event.preventDefault();
      event.stopPropagation();
      scrollLock.hold();
      if (!event.shiftKey) return;
      coordinator.add({
        delta: event.deltaY || event.deltaX,
        continuing,
        capture: () => {
          const state = engine.read();
          const box = viewport.getBoundingClientRect();
          return wheelAnchor({
            geometry: state.geometry,
            viewport: { ...state.viewport, top: viewport.scrollTop, left: viewport.scrollLeft },
            pointer: { x: event.clientX - box.left, y: event.clientY - box.top }
          });
        }
      });
    };
    const handleTouch = (event: TouchEvent) => {
      if (!callback.current || !event.shiftKey) return;
      event.preventDefault();
      event.stopPropagation();
      mode = "zoom";
      tail = performance.now() + 300;
      scrollLock.hold();
    };
    viewport.addEventListener("wheel", handle, { passive: false });
    viewport.addEventListener("touchmove", handleTouch, { passive: false });
    return () => {
      coordinator.dispose();
      viewport.removeEventListener("wheel", handle);
      viewport.removeEventListener("touchmove", handleTouch);
    };
  }, [adapter, containerRef, enabled, engine]);
}
