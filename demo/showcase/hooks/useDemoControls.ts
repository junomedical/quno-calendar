import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { TimelineSettings } from "quno-calendar";
import type { CalendarView } from "../types";

export type DemoControlDefaults = {
  calendarView: CalendarView;
  calendarCount: number;
  zoom: number;
  snapMinutes: number;
  startHour: number;
  endHour: number;
  excludeWeekends: boolean;
  editAvailabilities: boolean;
  apiLatencyMs?: number;
  jumpDate?: string;
  jumpTime?: string;
};

export type DemoLayoutSettings = Pick<
  TimelineSettings,
  | "rowHeight"
  | "dayHeaderHeight"
  | "labelWidth"
  | "verticalColumnMinWidth"
  | "verticalColumnOverlapCapacity"
  | "verticalColumnOverlapGrowth"
  | "verticalEventHoverMinHeight"
>;

export type DemoControls = {
  calendarView: CalendarView;
  setCalendarView: Dispatch<SetStateAction<CalendarView>>;
  calendarCount: number;
  setCalendarCount: Dispatch<SetStateAction<number>>;
  zoom: number;
  setZoom: Dispatch<SetStateAction<number>>;
  snapMinutes: number;
  setSnapMinutes: Dispatch<SetStateAction<number>>;
  startHour: number;
  setStartHour: Dispatch<SetStateAction<number>>;
  endHour: number;
  setEndHour: Dispatch<SetStateAction<number>>;
  excludeWeekends: boolean;
  setExcludeWeekends: Dispatch<SetStateAction<boolean>>;
  editAvailabilities: boolean;
  setEditAvailabilities: Dispatch<SetStateAction<boolean>>;
  apiLatencyMs: number;
  setApiLatencyMs: Dispatch<SetStateAction<number>>;
  jumpDate: string;
  setJumpDate: Dispatch<SetStateAction<string>>;
  jumpTime: string;
  setJumpTime: Dispatch<SetStateAction<string>>;
  settings: TimelineSettings;
};

export function useDemoControls(defaults: DemoControlDefaults, layout: DemoLayoutSettings): DemoControls {
  const [calendarView, setCalendarView] = useState<CalendarView>(defaults.calendarView);
  const [calendarCount, setCalendarCount] = useState(defaults.calendarCount);
  const [zoom, setZoom] = useState(defaults.zoom);
  const [snapMinutes, setSnapMinutes] = useState(defaults.snapMinutes);
  const [startHour, setStartHour] = useState(defaults.startHour);
  const [endHour, setEndHour] = useState(defaults.endHour);
  const [excludeWeekends, setExcludeWeekends] = useState(defaults.excludeWeekends);
  const [editAvailabilities, setEditAvailabilities] = useState(defaults.editAvailabilities);
  const [apiLatencyMs, setApiLatencyMs] = useState(defaults.apiLatencyMs ?? 0);
  const [jumpDate, setJumpDate] = useState(defaults.jumpDate ?? "2026-07-04");
  const [jumpTime, setJumpTime] = useState(defaults.jumpTime ?? "09:00");

  const settings = useMemo<TimelineSettings>(
    () => ({
      ...layout,
      startHour,
      endHour,
      zoom,
      snapMinutes,
      excludedWeekdays: excludeWeekends ? [0, 6] : []
    }),
    [endHour, excludeWeekends, layout, snapMinutes, startHour, zoom]
  );

  return {
    calendarView,
    setCalendarView,
    calendarCount,
    setCalendarCount,
    zoom,
    setZoom,
    snapMinutes,
    setSnapMinutes,
    startHour,
    setStartHour,
    endHour,
    setEndHour,
    excludeWeekends,
    setExcludeWeekends,
    editAvailabilities,
    setEditAvailabilities,
    apiLatencyMs,
    setApiLatencyMs,
    jumpDate,
    setJumpDate,
    jumpTime,
    setJumpTime,
    settings
  };
}
