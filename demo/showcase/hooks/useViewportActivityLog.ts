import { useEffect, type RefObject } from "react";

type ViewportActivityLogArgs = {
  containerRef: RefObject<HTMLElement | null>;
  resetKey: string;
  onActivity: (message: string) => void;
};

const SCROLL_SETTLE_MS = 180;
const MANUAL_INTENT_TAIL_MS = 600;
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

function viewportPosition(viewport: HTMLElement) {
  return {
    top: Math.round(viewport.scrollTop),
    left: Math.round(viewport.scrollLeft)
  };
}

function activityMessage(kind: "scrolled" | "repositioned", position: ReturnType<typeof viewportPosition>) {
  return `Viewport ${kind} — top ${position.top}px, left ${position.left}px`;
}

/** Reports settled demo viewport movement without exposing a library-level instrumentation API. */
export function useViewportActivityLog({ containerRef, resetKey, onActivity }: ViewportActivityLogArgs) {
  useEffect(() => {
    void resetKey;
    const viewport = containerRef.current?.querySelector<HTMLElement>(".quno-calendar-viewport");
    if (!viewport) return;

    let settleTimer: number | null = null;
    let manualIntentUntil = 0;
    let lastReported = viewportPosition(viewport);
    const markManualIntent = () => {
      manualIntentUntil = performance.now() + MANUAL_INTENT_TAIL_MS;
    };
    const handleKey = (event: KeyboardEvent) => {
      if (MANUAL_SCROLL_KEYS.has(event.key)) markManualIntent();
    };
    const handlePointer = (event: PointerEvent) => {
      if (event.target === viewport) markManualIntent();
    };
    const clearManualIntentOutsideViewport = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || !viewport.contains(event.target)) manualIntentUntil = 0;
    };
    const handleScroll = () => {
      if (settleTimer !== null) window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        settleTimer = null;
        const position = viewportPosition(viewport);
        if (position.top === lastReported.top && position.left === lastReported.left) return;
        lastReported = position;
        const kind = performance.now() <= manualIntentUntil ? "scrolled" : "repositioned";
        onActivity(activityMessage(kind, position));
      }, SCROLL_SETTLE_MS);
    };

    viewport.addEventListener("wheel", markManualIntent, { passive: true });
    viewport.addEventListener("touchmove", markManualIntent, { passive: true });
    viewport.addEventListener("pointerdown", handlePointer, { passive: true });
    viewport.addEventListener("pointerup", handlePointer, { passive: true });
    viewport.addEventListener("keydown", handleKey);
    viewport.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pointerdown", clearManualIntentOutsideViewport, true);
    return () => {
      if (settleTimer !== null) window.clearTimeout(settleTimer);
      viewport.removeEventListener("wheel", markManualIntent);
      viewport.removeEventListener("touchmove", markManualIntent);
      viewport.removeEventListener("pointerdown", handlePointer);
      viewport.removeEventListener("pointerup", handlePointer);
      viewport.removeEventListener("keydown", handleKey);
      viewport.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointerdown", clearManualIntentOutsideViewport, true);
    };
  }, [containerRef, onActivity, resetKey]);
}
