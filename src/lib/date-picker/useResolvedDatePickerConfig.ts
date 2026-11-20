import { useMemo } from "react";
import { DEFAULT_FORMATTERS, DEFAULT_LABELS } from "./datePickerFormatters";
import { resolveDatePickerDisabledDayPredicate } from "./datePickerDisabledDays";
import type { QunoDatePickerProps, ResolvedDatePickerConfig } from "./datePickerTypes";

export function useResolvedConfig({
  selectionMode,
  locale,
  labels,
  formatters,
  classNames,
  limitDateFrom,
  limitDateTo,
  isDayDisabled,
  getDayCellProps,
  showMonthNavigation,
  limitNavigation,
  padDayNumbers
}: Pick<
  QunoDatePickerProps,
  | "selectionMode"
  | "locale"
  | "labels"
  | "formatters"
  | "classNames"
  | "limitDateFrom"
  | "limitDateTo"
  | "isDayDisabled"
  | "getDayCellProps"
  | "showMonthNavigation"
  | "limitNavigation"
  | "padDayNumbers"
>) {
  const effectiveIsDayDisabled = useMemo(
    () => resolveDatePickerDisabledDayPredicate({ matcher: isDayDisabled, limitDateFrom, limitDateTo }),
    [isDayDisabled, limitDateFrom, limitDateTo]
  );
  const config: ResolvedDatePickerConfig = useMemo(() => {
    const modeLabels =
      selectionMode === "single"
        ? { calendar: "Date picker", selectedPeriod: "Selected day", hint: "Choose one day." }
        : {};
    return {
      locale: locale ?? "en-GB",
      labels: { ...DEFAULT_LABELS, ...modeLabels, ...labels },
      formatters: { ...DEFAULT_FORMATTERS, ...formatters },
      classNames,
      isDayDisabled: effectiveIsDayDisabled,
      limitDateFrom,
      limitDateTo,
      getDayCellProps,
      showMonthNavigation,
      limitNavigation,
      padDayNumbers
    };
  }, [
    classNames,
    effectiveIsDayDisabled,
    formatters,
    getDayCellProps,
    labels,
    locale,
    selectionMode,
    limitDateFrom,
    limitDateTo,
    showMonthNavigation,
    limitNavigation,
    padDayNumbers
  ]);
  return { config, effectiveIsDayDisabled };
}
