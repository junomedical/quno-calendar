import { formatHorizontalDateLabel } from "../../../date/dateLabels";
import { fromDateKey } from "../../../date/dateVirtualization";
import { minuteToX } from "../../../time/time";
import { TIMELINE_LEFT_GUTTER_PX } from "../../../time/timelineTicks";
import type { TimelineSettings } from "../../../core/types";

/** Sticky date chrome: header band, current-time marker, and readable date label. */

type HorizontalDayHeaderProps = {
  dateKey: string;
  settings: TimelineSettings;
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
        className="ic-day-header-band"
        data-testid="calendar-day-header-band"
        data-date={dateKey}
        style={{ top: 0, height: settings.dayHeaderHeight, width: "100%", minWidth: headerWidth }}
      />
      {showNowLine ? (
        <div
          className={`ic-now-day-header-line ${dateKey === todayKey ? "is-current" : "is-reference"}`}
          data-testid="current-time-day-header-line"
          data-date={dateKey}
          style={{
            left: settings.labelWidth + TIMELINE_LEFT_GUTTER_PX + minuteToX(nowMinute, settings),
            height: settings.dayHeaderHeight
          }}
        />
      ) : null}
      <div
        className="ic-day-header"
        data-testid="calendar-day-header"
        data-date={dateKey}
        style={{ top: 0, height: settings.dayHeaderHeight, width: "100%", minWidth: headerWidth }}
      >
        <div className="ic-left-label ic-date-label" style={{ width: settings.labelWidth }}>
          {formatHorizontalDateLabel(fromDateKey(dateKey), settings)}
        </div>
      </div>
    </>
  );
}
