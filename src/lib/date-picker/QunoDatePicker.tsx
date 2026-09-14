import { Calendar } from "./Calendar";
import { classNames as cx } from "#quno-internal/shared/classNames";
import { monthRelation } from "#quno-internal/date-picker/datePickerModel";
import { DEFAULT_FORMATTERS, DEFAULT_LABELS } from "./datePickerFormatters";
import { OffscreenPills } from "./OffscreenPills";
import { SelectionHeader } from "./SelectionHeader";
import { useDatePickerController } from "./useDatePickerController";
import { resolveDatePickerDisabledDayPredicate } from "./datePickerDisabledDays";
import type { QunoDatePickerProps, ResolvedDatePickerConfig } from "./datePickerTypes";
import type { JSX } from "react";
import { useMemo, useState } from "react";

function useResolvedConfig({
  selectionMode,
  locale,
  labels,
  formatters,
  classNames,
  limitDateFrom,
  limitDateTo,
  isDayDisabled,
  getDayCellProps
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
      getDayCellProps
    };
  }, [classNames, effectiveIsDayDisabled, formatters, getDayCellProps, labels, locale, selectionMode]);
  return { config, effectiveIsDayDisabled };
}

export const QunoDatePicker = ({
  value,
  defaultValue = null,
  selectionMode = "range",
  initialMonth,
  locale = "en-GB",
  labels,
  formatters,
  weekStartsOn = 1,
  className,
  classNames,
  limitDateFrom,
  limitDateTo,
  isDayDisabled,
  getDayCellProps,
  calendarFooter,
  autoNavigateDelay = 400,
  autoNavigateRepeatDelay = 650,
  onChange,
  onVisibleMonthChange
}: QunoDatePickerProps): JSX.Element => {
  const [monthNavigationOpen, setMonthNavigationOpen] = useState(false);
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
    onChange,
    onVisibleMonthChange
  });
  const endpointPositions = useMemo(
    () =>
      controller.selection
        ? [
            monthRelation({ date: controller.selection.start, month: controller.visibleMonth }),
            monthRelation({ date: controller.selection.end, month: controller.visibleMonth })
          ]
        : [],
    [controller.selection, controller.visibleMonth]
  );

  return (
    <section
      className={cx({ values: ["quno-date-picker", className, classNames?.root] })}
      data-slot="root"
      data-pill-before={endpointPositions.includes("before") || undefined}
      data-pill-after={endpointPositions.includes("after") || undefined}
      aria-label={config.labels.calendar}
      onPointerUp={controller.stopEdgeNavigation}
    >
      <SelectionHeader selection={controller.selection} config={config} onClear={controller.clear} />
      <OffscreenPills
        selection={controller.selection}
        selectionMode={selectionMode}
        visibleMonth={controller.visibleMonth}
        position="before"
        monthChangeSource={controller.monthChangeSource}
        config={config}
        onJump={({ date }) => {
          controller.jumpToEndpoint({ date });
          setMonthNavigationOpen(false);
        }}
      />
      <Calendar
        controller={controller}
        config={config}
        monthNavigationOpen={monthNavigationOpen}
        onMonthNavigationOpenChange={({ open }) => setMonthNavigationOpen(open)}
        footer={calendarFooter}
      />
      <OffscreenPills
        selection={controller.selection}
        selectionMode={selectionMode}
        visibleMonth={controller.visibleMonth}
        position="after"
        monthChangeSource={controller.monthChangeSource}
        config={config}
        onJump={({ date }) => {
          controller.jumpToEndpoint({ date });
          setMonthNavigationOpen(false);
        }}
      />
      {config.labels.hint && (
        <p className={cx({ values: ["quno-date-picker-hint", classNames?.hint] })} data-slot="hint">
          {config.labels.hint}
        </p>
      )}
    </section>
  );
};

export type {
  DateAction,
  DatePickerInteraction,
  QunoDatePickerClassNames,
  QunoDatePickerDayCellContext,
  QunoDatePickerDayCellCustomizer,
  QunoDatePickerDayCellProps,
  QunoDatePickerDisabledDayPredicate,
  QunoDatePickerFormatters,
  QunoDatePickerLabels,
  QunoDatePickerProps,
  QunoDatePickerSlot
} from "./datePickerTypes";
