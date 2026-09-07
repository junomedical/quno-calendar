import { useRef } from "react";
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
      const target = currentTarget(event);
      if (!target || (active.current && sameTarget({ left: active.current.last, right: target }))) {
        return;
      }
      if (active.current) {
        active.current.last = target;
      } else {
        active.current = { id: pointerId(event), last: target };
      }
      enter(target);
    },
    finishPointer: ({ event, fallback }: { event: DayPointerEvent; fallback: IsoDate }): void => {
      if (!matches(event)) return;
      event.preventDefault();
      const target = currentTarget(event) ??
        active.current?.last ?? {
          date: fallback,
          overflowIndex: null
        };
      release(event);
      finish(target);
    },
    cancelPointer: (event: DayPointerEvent): void => {
      if (!matches(event)) return;
      release(event);
      cancel();
    }
  };
};
