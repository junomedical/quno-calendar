import { Calendar } from "./Calendar";
import { classNames as cx } from "#quno-internal/shared/classNames";
import { monthRelation } from "#quno-internal/date-picker/datePickerModel";
import { OffscreenPills } from "./OffscreenPills";
import { SelectionHeader } from "./SelectionHeader";
import { useDatePickerSetup } from "./useDatePickerSetup";
import type { QunoDatePickerProps } from "./datePickerTypes";
import type { JSX } from "react";
import { useMemo } from "react";

export const QunoDatePicker = (props: QunoDatePickerProps): JSX.Element => {
  const { className, classNames, calendarFooter, selectionMode = "range" } = props;
  const { view, setView, clock, config, controller } = useDatePickerSetup(props);
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
      <SelectionHeader
        selection={controller.selection}
        time={clock.enabled ? clock.time : null}
        config={config}
        onClear={controller.clear}
      />
      <OffscreenPills
        selection={controller.selection}
        selectionMode={selectionMode}
        visibleMonth={controller.visibleMonth}
        position="before"
        monthChangeSource={controller.monthChangeSource}
        config={config}
        onJump={({ date }) => {
          controller.jumpToEndpoint({ date });
          setView("dates");
        }}
      />
      <Calendar
        controller={controller}
        config={config}
        view={view}
        onViewChange={({ view }) => setView(view)}
        clock={clock}
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
          setView("dates");
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
