import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type KeyboardEvent,
  type RefObject
} from "react";
type Point = { x: number; y: number };
type Position = { left: number; bottom: number };
const home: Position = { left: 24, bottom: 24 };
export function useFloatingGuide(container: RefObject<HTMLDivElement>, stop: () => void, mobile = false) {
  const card = useRef<HTMLElement>(null);
  const [position, setPosition] = useState<Position>(home);
  const current = useRef(position);
  const drag = useRef<{ id: number; pointer: Point; origin: Position } | null>(null);
  const frame = useRef(0);
  const pending = useRef<Position | null>(null);
  const place = useCallback(
    (point: Position) => {
      const parent = container.current;
      const element = card.current;
      if (!parent || !element) return;
      const bottomMargin = parseFloat(getComputedStyle(element).marginBottom) || 0;
      parent.style.setProperty("--concept-guide-height", `${element.getBoundingClientRect().height}px`);
      if (mobile) return;
      const next = {
        left: Math.max(12, Math.min(point.left, parent.clientWidth - element.offsetWidth - 12)),
        bottom: Math.max(12, Math.min(point.bottom, parent.clientHeight - element.offsetHeight - bottomMargin - 12))
      };
      current.current = next;
      setPosition((value) => (value.left === next.left && value.bottom === next.bottom ? value : next));
    },
    [container, mobile]
  );
  useLayoutEffect(() => {
    let observingParent = false;
    const clamp = () => {
      if (!container.current || !card.current) return;
      if (!observingParent) {
        observer.observe(container.current);
        observingParent = true;
      }
      place(current.current);
    };
    const observer = new ResizeObserver(clamp);
    if (card.current) observer.observe(card.current);
    clamp();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, [container, place]);
  const finish = () => {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    if (pending.current) place(pending.current);
    pending.current = null;
    drag.current = null;
  };
  return {
    card,
    position,
    handle: {
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        if (mobile || event.button !== 0 || (event.target as Element).closest("button, a, input, select, textarea"))
          return;
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        stop();
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = {
          id: event.pointerId,
          pointer: { x: event.clientX, y: event.clientY },
          origin: current.current
        };
      },
      onPointerMove: (event: PointerEvent<HTMLElement>) => {
        const start = drag.current;
        if (!start || start.id !== event.pointerId) return;
        pending.current = {
          left: start.origin.left + event.clientX - start.pointer.x,
          bottom: start.origin.bottom - event.clientY + start.pointer.y
        };
        if (!frame.current)
          frame.current = requestAnimationFrame(() => {
            frame.current = 0;
            if (pending.current) place(pending.current);
          });
      },
      onPointerUp: finish,
      onPointerCancel: finish,
      onLostPointerCapture: finish,
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
        if (mobile || event.target !== event.currentTarget) return;
        const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
        if (!direction && event.key !== "Home") return;
        event.preventDefault();
        stop();
        const step = event.shiftKey ? 50 : 20;
        place(
          direction
            ? { left: current.current.left + direction[0] * step, bottom: current.current.bottom - direction[1] * step }
            : home
        );
      }
    }
  };
}
