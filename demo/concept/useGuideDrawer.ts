import { useLayoutEffect, useRef, type MouseEvent, type PointerEvent, type RefObject } from "react";

type Options = {
  card: RefObject<HTMLElement>;
  mobile: boolean;
  collapsed: boolean;
  toggle: () => void;
};

/** Mobile drawer gestures stay on the header so explanation/contents scrolling remains native. */
export function useGuideDrawer({ card, mobile, collapsed, toggle }: Options) {
  const previous = useRef<{ height: number; collapsed: boolean; mobile: boolean } | null>(null);
  const gesture = useRef<{ id: number; x: number; y: number; distance: number } | null>(null);
  const suppressClick = useRef(false);
  const motion = useRef<Animation | null>(null);
  const releasedHeight = useRef<number | null>(null);
  useLayoutEffect(() => {
    const element = card.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      if (previous.current && !motion.current) previous.current.height = element.getBoundingClientRect().height;
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [card]);
  useLayoutEffect(() => {
    const element = card.current;
    if (!element) return;
    const height = element.getBoundingClientRect().height;
    const before = previous.current;
    const from = releasedHeight.current ?? before?.height ?? height;
    releasedHeight.current = null;
    previous.current = { height, collapsed, mobile };
    if (!mobile || !before?.mobile || before.collapsed === collapsed) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const origin = collapsed ? Math.max(height, from) : from;
    const animation = element.animate([{ height: `${origin}px` }, { height: `${height}px` }], {
      duration: 240,
      easing: "cubic-bezier(0.2, 0, 0, 1)"
    });
    motion.current = animation;
    animation.onfinish = () => {
      motion.current = null;
    };
    return () => {
      animation.cancel();
      motion.current = null;
    };
  }, [card, collapsed, mobile]);
  const reset = () => {
    gesture.current = null;
    card.current?.style.removeProperty("--concept-drawer-drag");
  };
  const finish = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    suppressClick.current = Math.abs(start.distance) > 8;
    if (!cancelled && (collapsed ? start.distance < -48 : start.distance > 48)) {
      if (!collapsed && card.current)
        releasedHeight.current = card.current.getBoundingClientRect().height - start.distance;
      toggle();
    }
    reset();
  };
  return {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      if (!mobile || event.button !== 0 || !event.isPrimary) return;
      suppressClick.current = false;
      const control = (event.target as Element).closest("button, a");
      if (control && !control.classList.contains("concept-tour-toggle")) return;
      (control ?? event.currentTarget).setPointerCapture(event.pointerId);
      gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, distance: 0 };
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      const start = gesture.current;
      if (!start || start.id !== event.pointerId) return;
      const distance = event.clientY - start.y;
      if (Math.abs(distance) < Math.abs(event.clientX - start.x)) return;
      start.distance = distance;
      if (!collapsed) card.current?.style.setProperty("--concept-drawer-drag", `${Math.max(0, distance)}px`);
    },
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => finish(event),
    onPointerCancel: (event: PointerEvent<HTMLDivElement>) => finish(event, true),
    onLostPointerCapture: reset,
    onClickCapture: (event: MouseEvent<HTMLDivElement>) => {
      const suppress = suppressClick.current;
      suppressClick.current = false;
      if (!suppress || event.detail === 0) return;
      event.preventDefault();
      event.stopPropagation();
    }
  };
}
