import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { CalendarView } from "../types";
import type { DemoTimelineSettings } from "../zoom/DemoZoom";

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
  DemoTimelineSettings,
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
  settings: DemoTimelineSettings;
};

export function useDemoControls(defaults: DemoControlDefaults, layout: DemoLayoutSettings): DemoControls {
  const [calendarView, setCalendarView] = useState<CalendarView>(defaults.calendarView);
  const [calendarCount, setCalendarCount] = useState(defaults.calendarCount);
  const [snapMinutes, setSnapMinutes] = useState(defaults.snapMinutes);
  const [startHour, setStartHour] = useState(defaults.startHour);
  const [endHour, setEndHour] = useState(defaults.endHour);
  const [excludeWeekends, setExcludeWeekends] = useState(defaults.excludeWeekends);
  const [editAvailabilities, setEditAvailabilities] = useState(defaults.editAvailabilities);
  const [apiLatencyMs, setApiLatencyMs] = useState(defaults.apiLatencyMs ?? 0);
  const [jumpDate, setJumpDate] = useState(defaults.jumpDate ?? "2026-07-04");
  const [jumpTime, setJumpTime] = useState(defaults.jumpTime ?? "09:00");

  const settings = useMemo<DemoTimelineSettings>(
    () => ({
      ...layout,
      startHour,
      endHour,
      snapMinutes,
      excludedWeekdays: excludeWeekends ? [0, 6] : []
    }),
    [endHour, excludeWeekends, layout, snapMinutes, startHour]
  );

  return {
    calendarView,
    setCalendarView,
    calendarCount,
    setCalendarCount,
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
