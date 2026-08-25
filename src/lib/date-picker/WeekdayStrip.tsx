import { classNames as cx } from "./classNames";
import { useEffect, useState } from "react";
import { addDays, isWithinRange, todayIso, type IsoDate, type WeekStart } from "#quno-internal/shared/dateRangeModel";
import type { DatePickerController } from "./datePickerControllerTypes";
import type { ResolvedDatePickerConfig } from "./datePickerTypes";
import type { JSX } from "react";

type Props = {
  controller: DatePickerController;
  config: ResolvedDatePickerConfig;
  touchOverflowIndex: number | null;
};

type StripMode = { type: "weekdays" } | { type: "previous-dates"; pointerIndex: number };

const targetIndex = (target: EventTarget | null, weekdays: number[]): number => {
  const element = (target as HTMLElement | null)?.closest<HTMLElement>("[data-day-index]");
  return weekdays.indexOf(Number(element?.dataset.dayIndex));
};

export const WeekdayStrip = ({ controller, config, touchOverflowIndex }: Props): JSX.Element => {
  const [mode, setMode] = useState<StripMode>({ type: "weekdays" });
  const { classNames, formatters, locale } = config;
  const { interaction, renderedSelection, weekdays } = controller;
  const dragActive = interaction.type !== "idle";
  const today = todayIso();
  const previousDates = Array.from({ length: 7 }, (_, index) => addDays(controller.gridDates[0], index - 7));

  useEffect(() => {
    if (!dragActive || touchOverflowIndex === null) {
      setMode({ type: "weekdays" });
      return;
    }
    setMode({ type: "previous-dates", pointerIndex: touchOverflowIndex });
  }, [dragActive, touchOverflowIndex]);

  const revealAt = (index: number): void => {
    if (!dragActive || index < 0) return;
    setMode({ type: "previous-dates", pointerIndex: index });
    controller.enterDay(previousDates[index]);
  };

  const finishAt = (date: IsoDate): void => {
    setMode({ type: "weekdays" });
    controller.finishDrag(date);
  };

  return (
    <div
      className={cx("quno-date-picker-weekdays", classNames?.weekdays)}
      data-slot="weekdays"
      data-drag-overflow={mode.type === "previous-dates" ? "previous" : undefined}
      data-drag-active={dragActive ? "true" : undefined}
      aria-hidden="true"
      onPointerEnter={(event) => {
        if (event.pointerType === "touch") return;
        revealAt(targetIndex(event.target, weekdays));
      }}
      onPointerLeave={() => setMode({ type: "weekdays" })}
      onPointerUp={(event) => {
        if (!dragActive) return;
        const index = targetIndex(event.target, weekdays);
        if (index < 0) return;
        event.preventDefault();
        finishAt(previousDates[index]);
      }}
    >
      {weekdays.map((dayIndex, index) => {
        const date = previousDates[index];
        const selected = renderedSelection ? isWithinRange(date, renderedSelection) : false;
        const revealed = mode.type === "previous-dates" && (selected || index === mode.pointerIndex);
        if (!revealed) {
          return (
            <span
              key={dayIndex}
              className={classNames?.weekday}
              data-slot="weekday"
              data-day-index={dayIndex}
              data-touch-date={date}
              data-touch-index={index}
              onPointerEnter={(event) => {
                if (event.pointerType !== "touch") revealAt(index);
              }}
            >
              {formatters.weekday(dayIndex, locale)}
            </span>
          );
        }
        const isStart = renderedSelection?.start === date;
        const isEnd = renderedSelection?.end === date;
        const committed = controller.selection ? isWithinRange(date, controller.selection) : false;
        const customProps = config.getDayCellProps?.({
          date,
          weekday: dayIndex as WeekStart,
          isToday: date === today,
          isWeekend: dayIndex === 0 || dayIndex === 6,
          isOutside: true,
          isSelected: selected,
          isCommitted: committed,
          isRangeStart: isStart,
          isRangeEnd: isEnd
        });
        return (
          <span
            key={dayIndex}
            className={cx(
              "quno-date-picker-day",
              "quno-date-picker-day--outside",
              "quno-date-picker-overflow-day",
              selected && "quno-date-picker-day--selected",
              isStart && "quno-date-picker-day--start",
              isEnd && "quno-date-picker-day--end",
              classNames?.day,
              classNames?.overflowDay,
              customProps?.className
            )}
            style={customProps?.style}
            title={customProps?.title}
            data-slot="overflow-day"
            data-day-index={dayIndex}
            data-date={date}
            data-touch-date={date}
            data-touch-index={index}
            data-selected={selected ? "true" : undefined}
            data-range-start={isStart ? "true" : undefined}
            data-range-end={isEnd ? "true" : undefined}
            data-outside="true"
            onPointerEnter={(event) => {
              if (event.pointerType !== "touch") revealAt(index);
            }}
            onPointerUp={(event) => {
              event.preventDefault();
              event.stopPropagation();
              finishAt(date);
            }}
          >
            <span>{Number(date.slice(-2))}</span>
          </span>
        );
      })}
    </div>
  );
};
