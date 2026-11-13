import { resourceRectangle } from "#quno-internal/timeline/runtime/model/resourceRectangle";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import { parseClockToMinutes } from "#quno-internal/timeline/time/time";
import { includedDate } from "#quno-internal/timeline/runtime/model/dates";
import { projectPoint } from "#quno-internal/timeline/runtime/model/projection";
import type { CalendarEngine } from "./CalendarEngine";

export function navigate({
  engine,
  date,
  time,
  calendarId,
  align
}: {
  engine: CalendarEngine;
  date: IsoDate;
  time?: string;
  calendarId?: string;
  align?: "center";
}) {
  const state = engine.read();
  const dateKey = includedDate({ date, excludedWeekdays: state.geometry.settings.excludedWeekdays });
  if (!dateKey) return;
  const validTime = time && /^\d{2}:\d{2}$/.test(time) ? time : undefined;
  const target = {
    dateKey,
    calendarId,
    minute: validTime ? parseClockToMinutes({ clock: validTime }) : undefined,
    resourceFraction: align === "center" ? 0.5 : undefined
  };
  const point = projectPoint({ geometry: state.geometry, target });
  const day = state.geometry.dates.find((day) => day.dateKey === dateKey);
  const index = day?.resources.findIndex((resource) => resource.calendarId === calendarId) ?? -1;
  const row = day && index >= 0 ? resourceRectangle({ geometry: state.geometry, day, index }) : null;
  const inset = state.geometry.settings.dayHeaderHeight;
  const visible =
    row && row.y >= state.viewport.top + inset && row.y + row.height <= state.viewport.top + state.viewport.height;
  const horizontal = state.geometry.orientation === "horizontal";
  const y =
    calendarId && horizontal
      ? align === "center"
        ? inset + (state.viewport.height - inset) / 2
        : visible && point
          ? point.y - state.viewport.top
          : inset
      : validTime && !horizontal
        ? 48
        : 0;
  engine.position({
    kind: "navigation",
    anchor: {
      target,
      axes: validTime ? (horizontal ? "both" : "y") : "y",
      screen: {
        x:
          horizontal && align === "center"
            ? state.geometry.labelWidth + (state.viewport.width - state.geometry.labelWidth) / 2
            : state.geometry.labelWidth + 48,
        y
      }
    },
    now: performance.now(),
    duration: align === "center" ? 2800 : 160
  });
}
