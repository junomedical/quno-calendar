import { Calendar } from "./Calendar";
import { classNames as cx } from "./classNames";
import { monthRelation } from "#quno-internal/shared/dateRangeModel";
import { DEFAULT_FORMATTERS, DEFAULT_LABELS } from "./datePickerFormatters";
import { OffscreenPills } from "./OffscreenPills";
import { SelectionHeader } from "./SelectionHeader";
import { useDatePickerController } from "./useDatePickerController";
import type { QunoDatePickerProps, ResolvedDatePickerConfig } from "./datePickerTypes";
import type { JSX } from "react";
import { useState } from "react";

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
  getDayCellProps,
  calendarFooter,
  autoNavigateDelay = 400,
  autoNavigateRepeatDelay = 650,
  onChange,
  onVisibleMonthChange
}: QunoDatePickerProps): JSX.Element => {
  const [monthNavigationOpen, setMonthNavigationOpen] = useState(false);
  const modeLabels =
    selectionMode === "single"
      ? { calendar: "Date picker", selectedPeriod: "Selected day", hint: "Choose one day." }
      : {};
  const config: ResolvedDatePickerConfig = {
    locale,
    labels: { ...DEFAULT_LABELS, ...modeLabels, ...labels },
    formatters: { ...DEFAULT_FORMATTERS, ...formatters },
    classNames,
    getDayCellProps
  };
  const controller = useDatePickerController({
    value,
    defaultValue,
    selectionMode,
    initialMonth,
    weekStartsOn,
    autoNavigateDelay,
    autoNavigateRepeatDelay,
    onChange,
    onVisibleMonthChange
  });
  const endpointPositions = controller.selection
    ? [
        monthRelation(controller.selection.start, controller.visibleMonth),
        monthRelation(controller.selection.end, controller.visibleMonth)
      ]
    : [];

  return (
    <section
      className={cx("quno-date-picker", className, classNames?.root)}
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
        onJump={(date) => {
          controller.jumpToEndpoint(date);
          setMonthNavigationOpen(false);
        }}
      />
      <Calendar
        controller={controller}
        config={config}
        monthNavigationOpen={monthNavigationOpen}
        onMonthNavigationOpenChange={setMonthNavigationOpen}
        footer={calendarFooter}
      />
      <OffscreenPills
        selection={controller.selection}
        selectionMode={selectionMode}
        visibleMonth={controller.visibleMonth}
        position="after"
        monthChangeSource={controller.monthChangeSource}
        config={config}
        onJump={(date) => {
          controller.jumpToEndpoint(date);
          setMonthNavigationOpen(false);
        }}
      />
      {config.labels.hint && (
        <p className={cx("quno-date-picker-hint", classNames?.hint)} data-slot="hint">
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
  QunoDatePickerFormatters,
  QunoDatePickerLabels,
  QunoDatePickerProps,
  QunoDatePickerSlot
} from "./datePickerTypes";
