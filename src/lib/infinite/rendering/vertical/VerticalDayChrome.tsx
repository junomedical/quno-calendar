/**
 * Vertical day chrome.
 * date/ticks/resources -> sticky date header + resource header + time scale
 */
import { formatMonthDayOrdinal, formatWeekday } from "../../../date/dateLabels";
import { fromDateKey } from "../../../date/dateVirtualization";
import { VERTICAL_TIMELINE_GUTTER_PX } from "./VerticalTimelineDay";
import type { VerticalTimelineDayProps } from "./types";

type VerticalDayChromeProps = {
  day: VerticalTimelineDayProps;
  dayWidth: number;
  gridTemplateColumns: string;
  renderedColumnIndexes: number[];
};

/** Sticky date/resource header plus the sticky vertical time scale. */
export function VerticalDayChrome({
  day,
  dayWidth,
  gridTemplateColumns,
  renderedColumnIndexes
}: VerticalDayChromeProps) {
  const date = fromDateKey(day.dateKey);
  const customDayName = day.settings.dayNameGenerator ? formatWeekday(date, day.settings) : null;

  return (
    <>
      <div
        className="icv-day-header"
        data-testid="calendar-day-header"
        data-date={day.dateKey}
        style={{ height: day.settings.dayHeaderHeight, minWidth: dayWidth }}
      >
        <div className="ic-left-label ic-date-label icv-date-label" style={{ width: day.labelWidth }}>
          {customDayName === null ? (
            <>
              <span className="icv-date-main">{formatMonthDayOrdinal(date, day.settings)}</span>
              <span className="icv-date-weekday">{formatWeekday(date, day.settings)}</span>
            </>
          ) : (
            <span className="icv-date-main">{customDayName}</span>
          )}
        </div>
        <div
          className="icv-calendar-header-grid"
          data-testid="vertical-calendar-header"
          style={{
            left: day.labelWidth,
            width: `calc(100% - ${day.labelWidth}px)`,
            minWidth: day.boardMinWidth,
            gridTemplateColumns
          }}
        >
          {renderedColumnIndexes.map((resourceIndex) => {
            const calendar = day.selectedCalendars[resourceIndex];
            const isHidden = day.hiddenCalendarIds.has(calendar.id);
            return (
              <div
                className="icv-calendar-header-cell"
                data-retained-hidden={isHidden ? "true" : undefined}
                aria-hidden={isHidden || undefined}
                style={{
                  visibility: isHidden ? "hidden" : undefined,
                  pointerEvents: isHidden ? "none" : undefined,
                  gridColumn: resourceIndex + 1
                }}
                key={calendar.id}
              >
                {calendar.name}
              </div>
            );
          })}
        </div>
      </div>
      <div
        className="icv-time-pane"
        data-testid="vertical-time-pane"
        style={{ width: day.labelWidth, height: day.boardHeight }}
      >
        <div className="icv-time-pane-content" style={{ width: day.labelWidth, height: day.boardHeight }}>
          <div
            className="icv-time-tick-track"
            style={{
              top: VERTICAL_TIMELINE_GUTTER_PX,
              height: day.boardHeight - VERTICAL_TIMELINE_GUTTER_PX * 2
            }}
          >
            {day.timeTicks.map((tick) => (
              <span
                className={["icv-time-tick", tick.isHour ? "is-hour" : "", tick.showLabel ? "" : "is-label-hidden"]
                  .filter(Boolean)
                  .join(" ")}
                key={`${day.dateKey}-time-${tick.minute}`}
                aria-hidden={!tick.showLabel}
                style={{ top: `${tick.positionPercent}%` }}
              >
                {formatVerticalTimeTick(tick.minute, tick.isHour)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function formatVerticalTimeTick(minute: number, isHour: boolean): string {
  return isHour ? `${Math.floor(minute / 60)}:00` : String(minute % 60);
}
