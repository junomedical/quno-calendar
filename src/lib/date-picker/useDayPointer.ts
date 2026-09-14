import { useEffect, useRef } from "react";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { PointerEvent as ReactPointerEvent } from "react";

type DayPointerEvent = ReactPointerEvent<HTMLButtonElement>;
export type DayPointerTarget = {
  date: IsoDate;
  overflowIndex: number | null;
};
type Callbacks = {
  interactionActive: boolean;
  begin: (args: { date: IsoDate }) => void;
  enter: (target: DayPointerTarget) => void;
  finish: (target: DayPointerTarget) => void;
  cancel: () => void;
};

const pointerTarget = ({ target }: { target: EventTarget | null }): DayPointerTarget | null => {
  const element = (target as Element | null)?.closest<HTMLElement>("[data-touch-date], [data-date]");
  const date = element?.dataset.touchDate ?? element?.dataset.date;
  if (!date) return null;
  return {
    date: date as IsoDate,
    overflowIndex: element?.dataset.touchIndex === undefined ? null : Number(element.dataset.touchIndex)
  };
};

const currentTarget = (event: DayPointerEvent): DayPointerTarget | null =>
  typeof document.elementFromPoint === "function"
    ? pointerTarget({ target: document.elementFromPoint(event.clientX, event.clientY) })
    : pointerTarget({ target: event.target });

const targetAt = ({
  clientX,
  clientY,
  fallback
}: {
  clientX: number;
  clientY: number;
  fallback: EventTarget | null;
}): DayPointerTarget | null =>
  typeof document.elementFromPoint === "function"
    ? pointerTarget({ target: document.elementFromPoint(clientX, clientY) })
    : pointerTarget({ target: fallback });

const sameTarget = ({ left, right }: { left: DayPointerTarget; right: DayPointerTarget }): boolean =>
  left.date === right.date && left.overflowIndex === right.overflowIndex;

const pointerId = (event: DayPointerEvent): number => event.pointerId ?? 0;

const capture = ({ element, id }: { element: HTMLButtonElement; id: number }): void => {
  try {
    element.setPointerCapture?.(id);
  } catch {
    // The browser may have ended a synthetic or cancelled pointer already.
  }
};

const releaseCapture = ({ element, id }: { element: HTMLButtonElement; id: number }): void => {
  try {
    if (element.hasPointerCapture?.(id)) element.releasePointerCapture(id);
  } catch {
    // Capture loss is already represented by the explicit interaction state.
  }
};

export const useDayPointer = ({ interactionActive, begin, enter, finish, cancel }: Callbacks) => {
  const active = useRef<{
    id: number;
    last: DayPointerTarget;
  } | null>(null);
  const pending = useRef<{ clientX: number; clientY: number; fallback: EventTarget | null } | null>(null);
  const frame = useRef<number | null>(null);
  const cancelFrame = (): void => {
    if (frame.current !== null) window.cancelAnimationFrame(frame.current);
    frame.current = null;
    pending.current = null;
  };
  const publishPending = (): void => {
    frame.current = null;
    const point = pending.current;
    pending.current = null;
    const target = point ? targetAt(point) : null;
    if (!target || (active.current && sameTarget({ left: active.current.last, right: target }))) return;
    if (active.current) active.current.last = target;
    enter(target);
  };
  useEffect(() => cancelFrame, []);
  const matches = (event: DayPointerEvent): boolean =>
    active.current?.id === pointerId(event) || (active.current === null && interactionActive);
  const release = (event: DayPointerEvent): void => {
    const id = pointerId(event);
    releaseCapture({ element: event.currentTarget, id });
    active.current = null;
  };

  return {
    beginPointer: ({ event, date }: { event: DayPointerEvent; date: IsoDate }): void => {
      event.preventDefault();
      const id = pointerId(event);
      active.current = {
        id,
        last: { date, overflowIndex: null }
      };
      capture({ element: event.currentTarget, id });
      begin({ date });
    },
    movePointer: (event: DayPointerEvent): void => {
      if (!matches(event)) return;
      event.preventDefault();
      pending.current = { clientX: event.clientX, clientY: event.clientY, fallback: event.target };
      if (frame.current === null) frame.current = window.requestAnimationFrame(publishPending);
    },
    finishPointer: ({ event, fallback }: { event: DayPointerEvent; fallback: IsoDate }): void => {
      if (!matches(event)) return;
      event.preventDefault();
      const finalPoint = pending.current;
      cancelFrame();
      const target = currentTarget(event) ??
        (finalPoint ? targetAt(finalPoint) : null) ??
        active.current?.last ?? {
          date: fallback,
          overflowIndex: null
        };
      if (active.current && !sameTarget({ left: active.current.last, right: target })) {
        active.current.last = target;
        enter(target);
      }
      release(event);
      finish(target);
    },
    cancelPointer: (event: DayPointerEvent): void => {
      if (!matches(event)) return;
      cancelFrame();
      release(event);
      cancel();
    }
  };
};
