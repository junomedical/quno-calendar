import { useLayoutEffect, useRef, type RefObject } from "react";

export function useTimeSelectionReveal({
  scroller,
  time,
  minuteCadence,
  hoursKey
}: {
  scroller: RefObject<HTMLDivElement>;
  time?: string | null;
  minuteCadence: number;
  hoursKey: string;
}) {
  const mounted = useRef(false);
  useLayoutEffect(() => {
    const initial = !mounted.current;
    mounted.current = true;
    const container = scroller.current;
    const group = container?.querySelector<HTMLElement>(`[data-hour="${Number(time?.slice(0, 2))}"]`);
    if (!container || !group) return;
    if (initial) container.scrollTop = group.offsetTop;
    const target = group.querySelector<HTMLElement>('[aria-pressed="true"]') ?? group.querySelector<HTMLElement>("h3");
    if (!target) return;
    const viewport = container.getBoundingClientRect();
    const bounds = target.getBoundingClientRect();
    const top = viewport.top + container.clientTop;
    const bottom = top + container.clientHeight;
    if (bounds.top < top) container.scrollTop += bounds.top - top;
    else if (bounds.bottom > bottom) container.scrollTop += bounds.bottom - bottom + 12;
  }, [scroller, time, minuteCadence, hoursKey]);
}
