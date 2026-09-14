import type { CalendarDateLabelOptions } from "#quno-internal/timeline/core/calendarFormatterTypes";
import { formatHorizontalDateLabel } from "#quno-internal/timeline/date/dateLabels";
import { fromDateKey } from "#quno-internal/timeline/date/dateVirtualization";
import { minuteToX } from "#quno-internal/timeline/time/time";
import { TIMELINE_LEFT_GUTTER_PX } from "#quno-internal/timeline/time/timelineTicks";
import type { QunoInfiniteCalendarDayProps, QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";

/** Sticky date chrome: header band, current-time marker, and readable date label. */

type HorizontalDayHeaderProps = CalendarDateLabelOptions & {
  dateKey: string;
  settings: QunoInfiniteCalendarSettings;
  timelineWidth: number;
  todayKey: string;
  showNowLine: boolean;
  nowMinute: number;
  calendarDayProps?: QunoInfiniteCalendarDayProps;
};

export function HorizontalDayHeader({
  dateKey,
  locale,
  formatters,
  settings,
  timelineWidth,
  todayKey,
  showNowLine,
  nowMinute,
  calendarDayProps
}: HorizontalDayHeaderProps) {
  const headerWidth = settings.labelWidth + TIMELINE_LEFT_GUTTER_PX + timelineWidth;

  return (
    <>
      <div
        className={["quno-calendar-day-header-band", calendarDayProps?.className].filter(Boolean).join(" ")}
        data-slot="calendar-day-header"
        data-testid="calendar-day-header-band"
        data-date={dateKey}
        title={calendarDayProps?.title}
        style={{
          ...calendarDayProps?.style,
          top: 0,
          height: settings.dayHeaderHeight,
          width: "100%",
          minWidth: headerWidth
        }}
      />
      {showNowLine ? (
        <div
          className={`quno-calendar-now-day-header-line ${dateKey === todayKey ? "is-current" : "is-reference"}`}
          data-testid="current-time-day-header-line"
          data-date={dateKey}
          style={{
            left: settings.labelWidth + TIMELINE_LEFT_GUTTER_PX + minuteToX({ minute: nowMinute, geometry: settings }),
            height: settings.dayHeaderHeight
          }}
        />
      ) : null}
      <div
        className="quno-calendar-day-header"
        data-testid="calendar-day-header"
        data-date={dateKey}
        style={{ top: 0, height: settings.dayHeaderHeight, width: "100%", minWidth: headerWidth }}
      >
        <div
          className={["quno-calendar-left-label", "quno-calendar-date-label", calendarDayProps?.className]
            .filter(Boolean)
            .join(" ")}
          data-slot="calendar-day-label"
          style={{ ...calendarDayProps?.style, width: settings.labelWidth }}
          title={calendarDayProps?.title}
        >
          {formatHorizontalDateLabel({ date: fromDateKey({ dateKey }), options: { locale, formatters } })}
        </div>
      </div>
    </>
  );
}
