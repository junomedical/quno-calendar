import { classNames as cx } from "#quno-internal/shared/classNames";
import { useEffect, useState } from "react";
import { addDays, isWithinRange, todayIso, type IsoDate, type WeekStart } from "#quno-internal/shared/dateRangeModel";
import type { DatePickerController } from "./datePickerControllerTypes";
import type { ResolvedDatePickerConfig } from "./datePickerTypes";
import { dayIsDisabled } from "./datePickerDisabledDays";
import type { JSX } from "react";

type Props = {
  controller: DatePickerController;
  config: ResolvedDatePickerConfig;
  touchOverflowIndex: number | null;
};

type StripMode = { type: "weekdays" } | { type: "previous-dates"; pointerIndex: number };

const targetIndex = ({ target, weekdays }: { target: EventTarget | null; weekdays: number[] }): number => {
  const element = (target as HTMLElement | null)?.closest<HTMLElement>("[data-day-index]");
  return weekdays.indexOf(Number(element?.dataset.dayIndex));
};

type OverflowDayProps = {
  config: ResolvedDatePickerConfig;
  controller: DatePickerController;
  date: IsoDate;
  dayIndex: number;
  index: number;
  selected: boolean;
  today: IsoDate;
  onReveal: (args: { index: number }) => void;
  onFinish: (args: { date: IsoDate }) => void;
};

const OverflowDay = ({
  config,
  controller,
  date,
  dayIndex,
  index,
  selected,
  today,
  onReveal,
  onFinish
}: OverflowDayProps): JSX.Element => {
  const isStart = controller.renderedSelection?.start === date;
  const isEnd = controller.renderedSelection?.end === date;
  const committed = controller.selection ? isWithinRange({ date, range: controller.selection }) : false;
  const disabled = dayIsDisabled({ matcher: config.isDayDisabled, date });
  const customProps = config.getDayCellProps?.({
    date,
    weekday: dayIndex as WeekStart,
    isToday: date === today,
    isWeekend: dayIndex === 0 || dayIndex === 6,
    isOutside: true,
    isDisabled: disabled,
    isSelected: selected,
    isCommitted: committed,
    isRangeStart: isStart,
    isRangeEnd: isEnd
  });
  return (
    <span
      className={cx({
        values: [
          "quno-date-picker-day",
          "quno-date-picker-day--outside",
          "quno-date-picker-overflow-day",
          selected && "quno-date-picker-day--selected",
          isStart && "quno-date-picker-day--start",
          isEnd && "quno-date-picker-day--end",
          disabled && "quno-date-picker-day--disabled",
          config.classNames?.day,
          config.classNames?.overflowDay,
          customProps?.className
        ]
      })}
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
      data-disabled={disabled ? "true" : undefined}
      aria-disabled={disabled || undefined}
      onPointerEnter={(event) => event.pointerType !== "touch" && onReveal({ index })}
      onPointerUp={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onFinish({ date });
      }}
    >
      <span>{config.padDayNumbers ? date.slice(-2) : Number(date.slice(-2))}</span>
    </span>
  );
};

export const WeekdayStrip = ({ controller, config, touchOverflowIndex }: Props): JSX.Element => {
  const [mode, setMode] = useState<StripMode>({ type: "weekdays" });
  const { classNames, formatters, locale } = config;
  const { interaction, renderedSelection, weekdays } = controller;
  const dragActive = interaction.type !== "idle";
  const today = todayIso();
  const previousDates = Array.from({ length: 7 }, (_, index) =>
    addDays({ date: controller.gridDates[0], amount: index - 7 })
  );

  useEffect(() => {
    if (!dragActive || touchOverflowIndex === null) {
      setMode({ type: "weekdays" });
      return;
    }
    setMode({ type: "previous-dates", pointerIndex: touchOverflowIndex });
  }, [dragActive, touchOverflowIndex]);

  const revealAt = ({ index }: { index: number }): void => {
    if (!dragActive || index < 0) return;
    setMode({ type: "previous-dates", pointerIndex: index });
    controller.enterDay({ date: previousDates[index] });
  };

  const finishAt = ({ date }: { date: IsoDate }): void => {
    setMode({ type: "weekdays" });
    controller.finishDrag({ date });
  };

  return (
    <div
      className={cx({ values: ["quno-date-picker-weekdays", classNames?.weekdays] })}
      data-slot="weekdays"
      data-drag-overflow={mode.type === "previous-dates" ? "previous" : undefined}
      data-drag-active={dragActive ? "true" : undefined}
      aria-hidden="true"
      onPointerEnter={(event) => {
        if (event.pointerType === "touch") return;
        revealAt({ index: targetIndex({ target: event.target, weekdays }) });
      }}
      onPointerLeave={() => setMode({ type: "weekdays" })}
      onPointerUp={(event) => {
        if (!dragActive) return;
        const index = targetIndex({ target: event.target, weekdays });
        if (index < 0) return;
        event.preventDefault();
        finishAt({ date: previousDates[index] });
      }}
    >
      {weekdays.map((dayIndex, index) => {
        const date = previousDates[index];
        const selected = renderedSelection ? isWithinRange({ date, range: renderedSelection }) : false;
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
                if (event.pointerType !== "touch") revealAt({ index });
              }}
            >
              {formatters.weekday({ weekday: dayIndex, locale })}
            </span>
          );
        }
        return (
          <OverflowDay
            key={dayIndex}
            config={config}
            controller={controller}
            date={date}
            dayIndex={dayIndex}
            index={index}
            selected={selected}
            today={today}
            onReveal={revealAt}
            onFinish={finishAt}
          />
        );
      })}
    </div>
  );
};
