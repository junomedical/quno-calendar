import { useLayoutEffect, useState, type RefObject } from "react";
import type { CalendarView } from "@quno/calendar/infinite-calendar";

export const conceptCalendarSettings = {
  startHour: 8,
  endHour: 19,
  rowHeight: 76,
  labelWidth: 238,
  verticalColumnMinWidth: 185,
  dateWindowRadius: 7
};
const maximum = 8;

export function useCalendarZoom(root: RefObject<HTMLDivElement>, view: CalendarView, initial: number) {
  const [minimum, setMinimum] = useState(0.5);
  const [labelWidth, setLabelWidth] = useState(conceptCalendarSettings.labelWidth);
  const [requested, setZoom] = useState(initial);
  useLayoutEffect(() => {
    const viewport = root.current?.querySelector<HTMLElement>(".quno-calendar-viewport");
    if (!viewport) return;
    const measure = () => {
      const { startHour, endHour } = conceptCalendarSettings;
      const width = viewport.clientWidth;
      const mobile = window.matchMedia("(max-width: 850px)").matches;
      const labels = view === "infinite-horizontal" && mobile ? width * 0.3 : conceptCalendarSettings.labelWidth;
      setLabelWidth(labels);
      const fit = (width - labels - 8) / ((endHour - startHour) * 60);
      setMinimum(view === "infinite-horizontal" ? Math.min(maximum, Math.max(0.5, Math.ceil(fit * 100) / 100)) : 0.5);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    measure();
    return () => observer.disconnect();
  }, [root, view]);
  const clamp = (value: number) => Math.max(minimum, Math.min(maximum, value));
  return { zoom: clamp(requested), setZoom, minimum, maximum, labelWidth };
}
