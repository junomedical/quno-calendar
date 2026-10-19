import { useEffect, useRef, useState, type FocusEvent } from "react";
import { todayIso, type DateRange, type IsoDate } from "@quno/calendar";
const monthOf = (date: IsoDate): IsoDate => `${date.slice(0, 7)}-01` as IsoDate;
export function useInputPicker(initial: DateRange | null) {
  const root = useRef<HTMLDivElement>(null);
  const pointerInside = useRef(false);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(monthOf(initial?.start ?? todayIso()));
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const release = () => {
      setTimeout(() => {
        pointerInside.current = false;
      }, 0);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("pointerup", release);
    document.addEventListener("pointercancel", release);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("pointerup", release);
      document.removeEventListener("pointercancel", release);
    };
  }, [open]);
  const blur = (event: FocusEvent<HTMLDivElement>) => {
    if (!pointerInside.current && !event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  };
  const follow = (previous: DateRange | null, next: DateRange | null) => {
    if (!next) return;
    const date = previous && previous.start !== next.start && previous.end === next.end ? next.start : next.end;
    const nextMonth = monthOf(date);
    if (month === nextMonth) return;
    setMonth(nextMonth);
    setRevision((value) => value + 1);
  };
  return {
    root,
    open,
    setOpen,
    month,
    setMonth,
    revision,
    blur,
    follow,
    pointerDown: () => {
      pointerInside.current = true;
    }
  };
}
