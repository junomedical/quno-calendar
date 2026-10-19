import { useEffect, useState, type RefObject } from "react";
import type { QunoInfiniteCalendarHandle } from "@quno/calendar/infinite-calendar";
import { date } from "./calendarFixtures";
export function useCalendarReadout(root: RefObject<HTMLDivElement>, handle: RefObject<QunoInfiniteCalendarHandle>) {
  const [visibleDate, setVisibleDate] = useState<string>(date);
  useEffect(() => {
    let timer = 0;
    const update = () => {
      if (timer) return;
      timer = window.setTimeout(() => {
        timer = 0;
        setVisibleDate(handle.current?.getVisibleDateKeys()[0] ?? date);
      }, 100);
    };
    const node = root.current;
    node?.addEventListener("scroll", update, true);
    return () => {
      clearTimeout(timer);
      node?.removeEventListener("scroll", update, true);
    };
  }, [root, handle]);
  return visibleDate;
}
