import { CalendarGrid } from "./CalendarGrid";
import { CalendarHeader } from "./CalendarHeader";
import { classNames as cx } from "#quno-internal/shared/classNames";
import { MonthNavigation } from "./MonthNavigation";
import { WeekdayStrip } from "./WeekdayStrip";
import type { DatePickerController } from "./datePickerControllerTypes";
import type { ResolvedDatePickerConfig } from "./datePickerTypes";
import type { JSX, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { TimeNavigation } from "./TimeNavigation";
import type { DatePickerClock } from "./useDatePickerTime";
import { useTimeDayNavigation } from "./useTimeDayNavigation";
type CalendarView = "dates" | "months" | "time";

type Props = {
  controller: DatePickerController;
  config: ResolvedDatePickerConfig;
  view: CalendarView;
  onViewChange: (args: { view: CalendarView }) => void;
  clock: DatePickerClock;
  footer?: ReactNode;
};

export const Calendar = ({ controller, config, view, onViewChange, clock, footer }: Props): JSX.Element => {
  const shell = useRef<HTMLDivElement>(null);
  const suppressDayClick = useRef(false);
  const timeEnabled = clock.enabled;
  const activeView =
    view === "time" &&
    (!timeEnabled || !controller.selection || config.isDayDisabled?.({ date: controller.selection.start }))
      ? "dates"
      : view;
  useEffect(() => {
    if (activeView !== view) onViewChange({ view: activeView });
  }, [activeView, onViewChange, view]);
  const monthNavigationOpen = activeView === "months";
  const dayNavigation = useTimeDayNavigation({ active: activeView === "time", controller, config });
  const changeView = ({ view }: { view: CalendarView }) => {
    controller.cancelDrag();
    onViewChange({ view });
  };
  const focusHeading = () =>
    shell.current?.querySelector<HTMLButtonElement>('[data-slot="month-heading-button"]')?.focus();
  const closeTime = () => {
    focusHeading();
    changeView({ view: "dates" });
  };
  const [touchOverflowIndex, setTouchOverflowIndex] = useState<number | null>(null);
  const movingSelection =
    controller.interaction.type === "drag-range" || controller.interaction.type === "drag-endpoint";
  return (
    <div
      ref={shell}
      className={cx({ values: ["quno-date-picker-calendar-shell", config.classNames?.calendar] })}
      data-slot="calendar"
      data-view={monthNavigationOpen ? "month-navigation" : activeView}
      data-dragging={movingSelection ? "move" : undefined}
      onPointerDownCapture={() => {
        suppressDayClick.current = false;
      }}
      onClickCapture={(event) => {
        if (suppressDayClick.current && event.detail > 0) {
          event.preventDefault();
          event.stopPropagation();
        }
        suppressDayClick.current = false;
      }}
      onKeyDown={(event) => {
        if (activeView === "dates" || event.key !== "Escape") return;
        event.preventDefault();
        if (activeView === "time") closeTime();
        else {
          event.currentTarget.querySelector<HTMLButtonElement>('[data-slot="month-heading-button"]')?.focus();
          changeView({ view: "dates" });
        }
      }}
    >
      {activeView === "dates" &&
        (["previous", "next"] as const).map((direction) => (
          <div
            key={direction}
            className={cx({
              values: ["quno-date-picker-edge", `quno-date-picker-edge--${direction}`, config.classNames?.edge]
            })}
            data-slot="edge"
            data-direction={direction}
            aria-hidden="true"
            onPointerEnter={() => controller.startEdgeNavigation({ direction: direction === "previous" ? -1 : 1 })}
            onPointerLeave={controller.stopEdgeNavigation}
          />
        ))}

      <CalendarHeader
        visibleMonth={controller.visibleMonth}
        timeDate={activeView === "time" ? controller.selection?.start : undefined}
        monthMotion={controller.monthMotion}
        config={config}
        monthNavigationOpen={monthNavigationOpen}
        previousDisabled={activeView === "time" && dayNavigation.previousDisabled}
        nextDisabled={activeView === "time" && dayNavigation.nextDisabled}
        onNavigate={({ direction }) => {
          if (activeView === "time") return dayNavigation.navigate({ direction });
          controller.navigate({ direction });
          changeView({ view: "dates" });
        }}
        onHeadingClick={() => {
          if (activeView === "time" && controller.selection)
            controller.goToMonth({ month: controller.selection.start });
          changeView({ view: activeView === "dates" ? "months" : "dates" });
        }}
      />

      {monthNavigationOpen ? (
        <MonthNavigation
          visibleMonth={controller.visibleMonth}
          config={config}
          onSelect={({ month }) => {
            controller.goToMonth({ month });
            changeView({ view: "dates" });
          }}
        />
      ) : activeView === "time" ? (
        <TimeNavigation
          clock={clock}
          config={config}
          onSelect={({ time }) => {
            if (!controller.selection || config.isDayDisabled?.({ date: controller.selection.start })) return;
            clock.select({ value: controller.selection, time });
            closeTime();
          }}
        />
      ) : (
        <>
          <WeekdayStrip controller={controller} config={config} touchOverflowIndex={touchOverflowIndex} />
          <CalendarGrid
            key={controller.visibleMonth}
            dates={controller.gridDates}
            visibleMonth={controller.visibleMonth}
            monthMotion={controller.monthMotion}
            movingSelection={movingSelection}
            interactionActive={controller.interaction.type !== "idle"}
            cycleDate={controller.cycleDate}
            cyclePreview={controller.cyclePreview}
            selection={controller.selection}
            renderedSelection={controller.renderedSelection}
            config={config}
            onBegin={controller.beginDrag}
            onEnter={controller.enterDay}
            onFinish={({ date }) => {
              if (timeEnabled) {
                suppressDayClick.current = true;
                focusHeading();
              }
              controller.finishDrag({ date });
            }}
            onActivate={
              timeEnabled
                ? ({ date }) => {
                    focusHeading();
                    controller.beginDrag({ date });
                    controller.finishDrag({ date });
                  }
                : undefined
            }
            onCancel={controller.cancelDrag}
            onOverflowChange={({ index }) => setTouchOverflowIndex(index)}
          />
        </>
      )}
      {activeView === "dates" && footer && (
        <div
          className={cx({ values: ["quno-date-picker-calendar-footer", config.classNames?.calendarFooter] })}
          data-slot="calendar-footer"
        >
          {footer}
        </div>
      )}
    </div>
  );
};
