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
  adapter: Pick<ViewportAdapter, "flush" | "subscribeCommit" | "scrollWheel">;
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
    let lastZoom = -Infinity;
    let active = false;
    const coordinator = new ZoomCommitCoordinator({
      engine,
      adapter,
      request: (input) => callback.current?.(input),
      cancel: () => {
        lastZoom = -Infinity;
        active = false;
        scrollLock.release();
      }
    });
    const release = () => {
      if (active) engine.cancel({ now: performance.now(), manual: true });
      else scrollLock.release();
    };
    const keyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift" && !event.shiftKey) scrollLock.release();
    };
    const handle = (event: WheelEvent) => {
      if (!callback.current) return;
      const now = performance.now();
      if (!event.shiftKey) {
        const needsDelivery = scrollLock.isHeld();
        release();
        if (needsDelivery) {
          // A missing keyup can leave overflow hidden during hit testing. Deliver this delta once.
          event.preventDefault();
          event.stopPropagation();
          adapter.scrollWheel(event);
        }
        return;
      }
      const continuing = now - lastZoom < 300;
      lastZoom = now;
      active = true;
      event.preventDefault();
      event.stopPropagation();
      scrollLock.hold();
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
      active = true;
      lastZoom = performance.now();
      scrollLock.hold();
    };
    const ownerWindow = viewport.ownerDocument.defaultView;
    ownerWindow?.addEventListener("keyup", keyUp);
    ownerWindow?.addEventListener("blur", release);
    viewport.addEventListener("wheel", handle, { passive: false });
    viewport.addEventListener("touchmove", handleTouch, { passive: false });
    return () => {
      coordinator.dispose();
      ownerWindow?.removeEventListener("keyup", keyUp);
      ownerWindow?.removeEventListener("blur", release);
      viewport.removeEventListener("wheel", handle);
      viewport.removeEventListener("touchmove", handleTouch);
    };
  }, [adapter, containerRef, enabled, engine]);
}
