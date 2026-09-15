import { classNames as cx } from "#quno-internal/shared/classNames";
import type { ResolvedDatePickerConfig } from "./datePickerTypes";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";
import type { MonthDirection } from "#quno-internal/date-picker/datePickerModel";
import type { JSX } from "react";

type Props = {
  showMonthNavigation?: boolean;
  navigationFrom?: IsoDate;
  navigationTo?: IsoDate;
  visibleMonth: IsoDate;
  monthMotion: MonthDirection | null;
  config: ResolvedDatePickerConfig;
  monthNavigationOpen: boolean;
  onNavigate: (args: { direction: MonthDirection }) => void;
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
  showMonthNavigation = true,
  navigationFrom,
  navigationTo,
  monthMotion,
  config,
  monthNavigationOpen,
  onNavigate,
  onToggleMonthNavigation
}: Props): JSX.Element => {
  const { labels, formatters, locale, classNames } = config;
  const monthLabel = formatters.month({ month: visibleMonth, locale });
  return (
    <div
      className={cx({ values: ["quno-date-picker-month-header", classNames?.monthHeader] })}
      data-slot="month-header"
    >
      <button
        type="button"
        className={classNames?.previousButton}
        data-slot="previous-button"
        disabled={navigationFrom ? visibleMonth.slice(0, 7) <= navigationFrom.slice(0, 7) : undefined}
        aria-label={labels.previousMonth}
        onClick={() => onNavigate({ direction: -1 })}
      >
        <Chevron direction={-1} />
      </button>
      <h2
        className={classNames?.monthHeading}
        data-slot="month-heading"
        data-month-motion={monthMotion === -1 ? "previous" : monthMotion === 1 ? "next" : undefined}
      >
        {showMonthNavigation ? (
          <button
            type="button"
            className={cx({ values: ["quno-date-picker-month-heading-button", classNames?.monthHeadingButton] })}
            data-slot="month-heading-button"
            aria-label={`${monthLabel}. ${
              monthNavigationOpen ? labels.closeMonthNavigation : labels.openMonthNavigation
            }`}
            aria-expanded={monthNavigationOpen}
            onClick={onToggleMonthNavigation}
          >
            <span key={visibleMonth}>{monthLabel}</span>
          </button>
        ) : (
          <span key={visibleMonth}>{monthLabel}</span>
        )}
      </h2>
      <button
        type="button"
        className={classNames?.nextButton}
        data-slot="next-button"
        disabled={navigationTo ? visibleMonth.slice(0, 7) >= navigationTo.slice(0, 7) : undefined}
        aria-label={labels.nextMonth}
        onClick={() => onNavigate({ direction: 1 })}
      >
        <Chevron direction={1} />
      </button>
    </div>
  );
};
