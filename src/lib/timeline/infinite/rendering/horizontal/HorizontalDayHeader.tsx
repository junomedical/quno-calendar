import { formatHorizontalDateLabel } from "#quno-internal/timeline/date/dateLabels";
import { fromDateKey } from "#quno-internal/timeline/date/dateVirtualization";
import { minuteToX } from "#quno-internal/timeline/time/time";
import { TIMELINE_LEFT_GUTTER_PX } from "#quno-internal/timeline/time/timelineTicks";
import type { QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";

/** Sticky date chrome: header band, current-time marker, and readable date label. */

type HorizontalDayHeaderProps = {
  dateKey: string;
  settings: QunoInfiniteCalendarSettings;
  timelineWidth: number;
  todayKey: string;
  showNowLine: boolean;
  nowMinute: number;
};

export function HorizontalDayHeader({
  dateKey,
  settings,
  timelineWidth,
  todayKey,
  showNowLine,
  nowMinute
}: HorizontalDayHeaderProps) {
  const headerWidth = settings.labelWidth + TIMELINE_LEFT_GUTTER_PX + timelineWidth;

  return (
    <>
      <div
        className="quno-calendar-day-header-band"
        data-testid="calendar-day-header-band"
        data-date={dateKey}
        style={{ top: 0, height: settings.dayHeaderHeight, width: "100%", minWidth: headerWidth }}
      />
      {showNowLine ? (
        <div
          className={`quno-calendar-now-day-header-line ${dateKey === todayKey ? "is-current" : "is-reference"}`}
          data-testid="current-time-day-header-line"
          data-date={dateKey}
          style={{
            left: settings.labelWidth + TIMELINE_LEFT_GUTTER_PX + minuteToX(nowMinute, settings),
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
        <div className="quno-calendar-left-label quno-calendar-date-label" style={{ width: settings.labelWidth }}>
          {formatHorizontalDateLabel(fromDateKey(dateKey), settings)}
        </div>
      </div>
    </>
  );
}
