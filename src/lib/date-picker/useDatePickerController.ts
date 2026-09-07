import { useDatePickerSelection } from "./useDatePickerSelection";
import { useState } from "react";
import { compareDates, startOfMonth, singleDay, todayIso, type IsoDate } from "#quno-internal/shared/dateRangeModel";
import { calendarGrid, type MonthDirection } from "#quno-internal/date-picker/datePickerModel";
import {
  advanceDateClickCycle,
  beginInteraction,
  idle,
  updateInteraction,
  type DateClickCycle
} from "./datePickerInteraction";
import { updateSingleDayInteraction } from "./datePickerSingleInteraction";
import { createFinishDatePickerDrag } from "./finishDatePickerDrag";
import { dayIsDisabled, interactionEndpointsAreEnabled } from "./datePickerDisabledDays";
import type { DatePickerController, DatePickerControllerOptions, MonthChangeSource } from "./datePickerControllerTypes";
import type { DatePickerInteraction } from "./datePickerTypes";
import { useDatePickerNavigation } from "./useDatePickerNavigation";

export const useDatePickerController = (options: DatePickerControllerOptions): DatePickerController => {
  const {
    value,
    defaultValue,
    selectionMode,
    initialMonth,
    weekStartsOn,
    isDayDisabled,
    autoNavigateDelay,
    autoNavigateRepeatDelay,
    onChange,
    onVisibleMonthChange
  } = options;
  const { selection, commit } = useDatePickerSelection({ value, defaultValue, selectionMode, onChange });
  const [visibleMonth, setVisibleMonth] = useState(
    startOfMonth({ date: initialMonth ?? selection?.start ?? todayIso() })
  );
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

  const navigate = ({ direction }: { direction: MonthDirection }): void =>
    navigateFrom({ direction, source: "navigation" });
  const goTo = ({ month, source }: { month: IsoDate; source: MonthChangeSource }): void => {
    resetInteraction();
    const target = startOfMonth({ date: month });
    if (target === visibleMonth) {
      setMonthMotion(null);
      return;
    }
    const direction = compareDates({ left: target, right: visibleMonth }) < 0 ? -1 : 1;
    changeMonth({ month: target, motion: direction, source });
  };
  const goToMonth = ({ month }: { month: IsoDate }): void => goTo({ month, source: "navigation" });
  const dragSelection = interaction.type === "idle" ? null : interaction.current;
  const renderedSelection = dragSelection ?? selection;
  const cycleDate = clickCycle?.date ?? null;
  const cyclePreview = clickCycle ? advanceDateClickCycle(clickCycle).value : null;

  const beginDrag = ({ date }: { date: IsoDate }): void => {
    if (dayIsDisabled({ matcher: isDayDisabled, date })) return;
    stopEdgeNavigation();
    setInteraction(
      selectionMode === "single"
        ? { type: "create", origin: date, current: singleDay({ date }), moved: false }
        : beginInteraction({ selection, date })
    );
  };

  const enterDay = ({ date }: { date: IsoDate }): void => {
    setInteraction((current) => {
      const next =
        selectionMode === "single"
          ? updateSingleDayInteraction({ interaction: current, date })
          : updateInteraction({ interaction: current, date });
      return interactionEndpointsAreEnabled({ matcher: isDayDisabled, interaction: next }) ? next : current;
    });
  };

  const finishDrag = createFinishDatePickerDrag({
    changeMonth,
    clickCycle,
    commit,
    interaction,
    selectionMode,
    isDayDisabled,
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
    commit({ value: null });
  };

  const jumpToEndpoint = ({ date }: { date: IsoDate }): void => goTo({ month: date, source: "endpoint" });

  return {
    selection,
    renderedSelection,
    cycleDate,
    cyclePreview,
    visibleMonth,
    monthMotion,
    monthChangeSource,
    interaction,
    gridDates: calendarGrid({ month: visibleMonth, weekStartsOn }),
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
