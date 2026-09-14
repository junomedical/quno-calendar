import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { addMonths, type DateSelectionMode, type IsoDate } from "#quno-internal/shared/dateRangeModel";
import { type MonthDirection } from "#quno-internal/date-picker/datePickerModel";
import type { DateClickCycle } from "./datePickerInteraction";
import type { MonthChangeSource } from "./datePickerControllerTypes";
import type { DatePickerInteraction } from "./datePickerTypes";

type Args = {
  autoNavigateDelay: number;
  autoNavigateRepeatDelay: number;
  interaction: DatePickerInteraction;
  selectionMode: DateSelectionMode;
  onVisibleMonthChange?: (args: { month: IsoDate }) => void;
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

  const changeMonth = ({
    month,
    motion = null,
    source = "interaction"
  }: {
    month: IsoDate;
    motion?: MonthDirection | null;
    source?: MonthChangeSource;
  }): void => {
    setMonthMotion(motion);
    setMonthChangeSource(source);
    setVisibleMonth(month);
    onVisibleMonthChange?.({ month });
  };
  const navigateFrom = ({ direction, source }: { direction: MonthDirection; source: MonthChangeSource }): void => {
    setMonthMotion(direction);
    setMonthChangeSource(source);
    setVisibleMonth((current) => {
      const next = addMonths({ date: current, amount: direction });
      onVisibleMonthChange?.({ month: next });
      return next;
    });
    setClickCycle(null);
  };
  const startEdgeNavigation = ({ direction }: { direction: MonthDirection }): void => {
    if (selectionMode === "single" || interaction.type === "idle") return;
    stopEdgeNavigation();
    const step = (): void => {
      navigateFrom({ direction, source: "interaction" });
      edgeTimer.current = window.setTimeout(step, autoNavigateRepeatDelay);
    };
    edgeTimer.current = window.setTimeout(step, autoNavigateDelay);
  };
  return { changeMonth, navigateFrom, startEdgeNavigation, stopEdgeNavigation };
}
