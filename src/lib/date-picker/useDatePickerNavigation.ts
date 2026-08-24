import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import {
  addMonths,
  type DateSelectionMode,
  type IsoDate,
  type MonthDirection
} from "#quno-internal/shared/dateRangeModel";
import type { DateClickCycle } from "./datePickerInteraction";
import type { MonthChangeSource } from "./datePickerControllerTypes";
import type { DatePickerInteraction } from "./datePickerTypes";

type Args = {
  autoNavigateDelay: number;
  autoNavigateRepeatDelay: number;
  interaction: DatePickerInteraction;
  selectionMode: DateSelectionMode;
  onVisibleMonthChange?: (month: IsoDate) => void;
  setClickCycle: Dispatch<SetStateAction<DateClickCycle | null>>;
  setMonthChangeSource: Dispatch<SetStateAction<MonthChangeSource | null>>;
  setMonthMotion: Dispatch<SetStateAction<MonthDirection | null>>;
  setVisibleMonth: Dispatch<SetStateAction<IsoDate>>;
};

export function useDatePickerNavigation({
  autoNavigateDelay,
  autoNavigateRepeatDelay,
  interaction,
  selectionMode,
  onVisibleMonthChange,
  setClickCycle,
  setMonthChangeSource,
  setMonthMotion,
  setVisibleMonth
}: Args) {
  const edgeTimer = useRef<number | null>(null);
  const stopEdgeNavigation = (): void => {
    if (edgeTimer.current === null) return;
    window.clearTimeout(edgeTimer.current);
    edgeTimer.current = null;
  };
  useEffect(() => stopEdgeNavigation, []);

  const changeMonth = (
    month: IsoDate,
    motion: MonthDirection | null = null,
    source: MonthChangeSource = "interaction"
  ): void => {
    setMonthMotion(motion);
    setMonthChangeSource(source);
    setVisibleMonth(month);
    onVisibleMonthChange?.(month);
  };
  const navigateFrom = (direction: MonthDirection, source: MonthChangeSource): void => {
    setMonthMotion(direction);
    setMonthChangeSource(source);
    setVisibleMonth((current) => {
      const next = addMonths(current, direction);
      onVisibleMonthChange?.(next);
      return next;
    });
    setClickCycle(null);
  };
  const startEdgeNavigation = (direction: MonthDirection): void => {
    if (selectionMode === "single" || interaction.type === "idle") return;
    stopEdgeNavigation();
    const step = (): void => {
      navigateFrom(direction, "interaction");
      edgeTimer.current = window.setTimeout(step, autoNavigateRepeatDelay);
    };
    edgeTimer.current = window.setTimeout(step, autoNavigateDelay);
  };
  return { changeMonth, navigateFrom, startEdgeNavigation, stopEdgeNavigation };
}
