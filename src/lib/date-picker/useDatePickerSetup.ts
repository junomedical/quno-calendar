import { useState } from "react";
import { useResolvedConfig } from "./useResolvedDatePickerConfig";
import { useDatePickerTime } from "./useDatePickerTime";
import { useDatePickerController } from "./useDatePickerController";
import type { QunoDatePickerProps } from "./datePickerTypes";

export function useDatePickerSetup({
  value,
  defaultValue = null,
  selectionMode = "range",
  initialMonth,
  locale = "en-GB",
  labels,
  formatters,
  weekStartsOn = 1,
  classNames,
  limitDateFrom,
  limitDateTo,
  isDayDisabled,
  getDayCellProps,
  autoNavigateDelay = 400,
  autoNavigateRepeatDelay = 650,
  onChange,
  timeMode,
  time,
  defaultTime,
  enabledHours,
  minuteCadence,
  onVisibleMonthChange
}: QunoDatePickerProps) {
  const [view, setView] = useState<"dates" | "months" | "time">("dates");
  const clock = useDatePickerTime({
    timeMode,
    selectionMode,
    time,
    defaultTime,
    enabledHours,
    minuteCadence,
    onChange
  });
  const { config, effectiveIsDayDisabled } = useResolvedConfig({
    selectionMode,
    locale,
    labels,
    formatters,
    classNames,
    limitDateFrom,
    limitDateTo,
    isDayDisabled,
    getDayCellProps
  });
  const controller = useDatePickerController({
    value,
    defaultValue,
    selectionMode,
    initialMonth,
    weekStartsOn,
    isDayDisabled: effectiveIsDayDisabled,
    autoNavigateDelay,
    autoNavigateRepeatDelay,
    onChange: ({ value }) => {
      clock.onDateChange({ value });
      if (clock.enabled) setView(value ? "time" : "dates");
    },
    onVisibleMonthChange
  });
  return { view, setView, clock, config, controller };
}
