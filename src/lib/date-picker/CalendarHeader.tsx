import { classNames as cx } from "./classNames";
import type { ResolvedDatePickerConfig } from "./datePickerTypes";
import type { IsoDate, MonthDirection } from "#quno-internal/shared/dateRangeModel";
import type { JSX } from "react";

type Props = {
  visibleMonth: IsoDate;
  monthMotion: MonthDirection | null;
  config: ResolvedDatePickerConfig;
  monthNavigationOpen: boolean;
  onNavigate: (direction: MonthDirection) => void;
  onToggleMonthNavigation: () => void;
};

const Chevron = ({ direction }: { direction: MonthDirection }): JSX.Element => (
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path
      d={direction === -1 ? "M10 3.5 5.5 8 10 12.5" : "M6 3.5 10.5 8 6 12.5"}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
    />
  </svg>
);

export const CalendarHeader = ({
  visibleMonth,
  monthMotion,
  config,
  monthNavigationOpen,
  onNavigate,
  onToggleMonthNavigation
}: Props): JSX.Element => {
  const { labels, formatters, locale, classNames } = config;
  const monthLabel = formatters.month(visibleMonth, locale);
  return (
    <div className={cx("quno-date-picker-month-header", classNames?.monthHeader)} data-slot="month-header">
      <button
        type="button"
        className={classNames?.previousButton}
        data-slot="previous-button"
        aria-label={labels.previousMonth}
        onClick={() => onNavigate(-1)}
      >
        <Chevron direction={-1} />
      </button>
      <h2
        className={classNames?.monthHeading}
        data-slot="month-heading"
        data-month-motion={monthMotion === -1 ? "previous" : monthMotion === 1 ? "next" : undefined}
      >
        <button
          type="button"
          className={cx("quno-date-picker-month-heading-button", classNames?.monthHeadingButton)}
          data-slot="month-heading-button"
          aria-label={`${monthLabel}. ${
            monthNavigationOpen ? labels.closeMonthNavigation : labels.openMonthNavigation
          }`}
          aria-expanded={monthNavigationOpen}
          onClick={onToggleMonthNavigation}
        >
          <span key={visibleMonth}>{monthLabel}</span>
        </button>
      </h2>
      <button
        type="button"
        className={classNames?.nextButton}
        data-slot="next-button"
        aria-label={labels.nextMonth}
        onClick={() => onNavigate(1)}
      >
        <Chevron direction={1} />
      </button>
    </div>
  );
};
