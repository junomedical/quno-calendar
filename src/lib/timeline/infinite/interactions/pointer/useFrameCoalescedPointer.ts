import { useCallback, useEffect, useRef } from "react";

export type PointerCoordinates = { clientX: number; clientY: number };

/** Publishes only the latest pointer coordinates in each display frame. */
export function useFrameCoalescedPointer({ onMove }: { onMove: (point: PointerCoordinates) => void }) {
  const moveRef = useRef(onMove);
  const latestRef = useRef<PointerCoordinates | null>(null);
  const frameRef = useRef<number | null>(null);
  moveRef.current = onMove;

  const cancel = useCallback(() => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    latestRef.current = null;
  }, []);

  const flush = useCallback((point?: PointerCoordinates) => {
    if (point) latestRef.current = { clientX: point.clientX, clientY: point.clientY };
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    const latest = latestRef.current;
    latestRef.current = null;
    if (latest) moveRef.current(latest);
  }, []);

  const schedule = useCallback(
    (point: PointerCoordinates) => {
      latestRef.current = { clientX: point.clientX, clientY: point.clientY };
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => flush());
    },
    [flush]
  );

  useEffect(() => cancel, [cancel]);
  return { schedule, flush, cancel };
}
