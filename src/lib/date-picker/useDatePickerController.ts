import { useState } from "react";
import {
  calendarGrid,
  compareDates,
  startOfMonth,
  singleDay,
  todayIso,
  type DateRange,
  type IsoDate,
  type MonthDirection
} from "#quno-internal/shared/dateRangeModel";
import {
  advanceDateClickCycle,
  beginInteraction,
  idle,
  updateInteraction,
  type DateClickCycle
} from "./datePickerInteraction";
import { updateSingleDayInteraction } from "./datePickerSingleInteraction";
import { createFinishDatePickerDrag } from "./finishDatePickerDrag";
import type { DatePickerController, DatePickerControllerOptions, MonthChangeSource } from "./datePickerControllerTypes";
import type { DatePickerInteraction } from "./datePickerTypes";
import { useDatePickerNavigation } from "./useDatePickerNavigation";

export const useDatePickerController = ({
  value,
  defaultValue,
  selectionMode,
  initialMonth,
  weekStartsOn,
  autoNavigateDelay,
  autoNavigateRepeatDelay,
  onChange,
  onVisibleMonthChange
}: DatePickerControllerOptions): DatePickerController => {
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const range = controlled ? (value ?? null) : internalValue;
  const selection = range && selectionMode === "single" ? singleDay(range.start) : range;
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(initialMonth ?? selection?.start ?? todayIso()));
  const [monthMotion, setMonthMotion] = useState<MonthDirection | null>(null);
  const [monthChangeSource, setMonthChangeSource] = useState<MonthChangeSource | null>(null);
  const [interaction, setInteraction] = useState<DatePickerInteraction>(idle());
  const [clickCycle, setClickCycle] = useState<DateClickCycle | null>(null);
  const { changeMonth, navigateFrom, startEdgeNavigation, stopEdgeNavigation } = useDatePickerNavigation({
    autoNavigateDelay,
    autoNavigateRepeatDelay,
    interaction,
    selectionMode,
    onVisibleMonthChange,
    setClickCycle,
    setMonthChangeSource,
    setMonthMotion,
    setVisibleMonth
  });

  const resetInteraction = (): void => {
    stopEdgeNavigation();
    setInteraction(idle());
    setClickCycle(null);
  };

  const commit = (nextValue: DateRange | null): void => {
    if (!controlled) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue);
  };

  const navigate = (direction: MonthDirection): void => navigateFrom(direction, "navigation");
  const goTo = (month: IsoDate, source: MonthChangeSource): void => {
    resetInteraction();
    const target = startOfMonth(month);
    if (target === visibleMonth) {
      setMonthMotion(null);
      return;
    }
    const direction = compareDates(target, visibleMonth) < 0 ? -1 : 1;
    changeMonth(target, direction, source);
  };
  const goToMonth = (month: IsoDate): void => goTo(month, "navigation");
  const dragSelection = interaction.type === "idle" ? null : interaction.current;
  const renderedSelection = dragSelection ?? selection;
  const cycleDate = clickCycle?.date ?? null;
  const cyclePreview = clickCycle ? advanceDateClickCycle(clickCycle).value : null;

  const beginDrag = (date: IsoDate): void => {
    stopEdgeNavigation();
    setInteraction(
      selectionMode === "single"
        ? { type: "create", origin: date, current: singleDay(date), moved: false }
        : beginInteraction(selection, date)
    );
  };

  const enterDay = (date: IsoDate): void => {
    setInteraction((current) =>
      selectionMode === "single" ? updateSingleDayInteraction(current, date) : updateInteraction(current, date)
    );
  };

  const finishDrag = createFinishDatePickerDrag({
    changeMonth,
    clickCycle,
    commit,
    interaction,
    selectionMode,
    setClickCycle,
    setInteraction,
    stopEdgeNavigation,
    visibleMonth
  });

  const cancelDrag = (): void => {
    stopEdgeNavigation();
    setInteraction(idle());
  };

  const clear = (): void => {
    resetInteraction();
    commit(null);
  };

  const jumpToEndpoint = (date: IsoDate): void => goTo(date, "endpoint");

  return {
    selection,
    renderedSelection,
    cycleDate,
    cyclePreview,
    visibleMonth,
    monthMotion,
    monthChangeSource,
    interaction,
    gridDates: calendarGrid(visibleMonth, weekStartsOn),
    weekdays: Array.from({ length: 7 }, (_, index) => (weekStartsOn + index) % 7),
    beginDrag,
    enterDay,
    finishDrag,
    cancelDrag,
    clear,
    navigate,
    goToMonth,
    startEdgeNavigation,
    stopEdgeNavigation,
    jumpToEndpoint
  };
};
