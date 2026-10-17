/**
 * Vertical day chrome.
 * date/ticks/resources -> sticky date header + resource header + time scale
 */
import { formatMonthDayOrdinal, formatWeekday } from "#quno-internal/timeline/date/dateLabels";
import { fromDateKey } from "#quno-internal/timeline/date/dateVirtualization";
import { VERTICAL_TIMELINE_GUTTER_PX } from "./VerticalTimelineDay";
import type { QunoInfiniteCalendarCellProps, QunoInfiniteCalendarDayProps } from "#quno-internal/timeline/core/types";
import type { VerticalTimelineDayProps } from "./types";
import {
  CalendarHourBands,
  calendarHourLabelProps
} from "#quno-internal/timeline/infinite/rendering/shared/CalendarHourBands";

type VerticalDayChromeProps = {
  day: VerticalTimelineDayProps;
  dayWidth: number;
  gridTemplateColumns: string;
  renderedColumnIndexes: number[];
  calendarCellProps: Map<string, QunoInfiniteCalendarCellProps | undefined>;
  calendarDayProps?: QunoInfiniteCalendarDayProps;
};

/** Sticky date/resource header plus the sticky vertical time scale. */
export function VerticalDayChrome({
  day,
  dayWidth,
  gridTemplateColumns,
  renderedColumnIndexes,
  calendarCellProps,
  calendarDayProps
}: VerticalDayChromeProps) {
  const date = fromDateKey({ dateKey: day.dateKey });
  const customDayName = day.formatters?.dayLabel ? formatWeekday({ date, options: day }) : null;

  return (
    <>
      <div
        className={["icv-day-header", calendarDayProps?.className].filter(Boolean).join(" ")}
        data-slot="calendar-day-header"
        data-testid="calendar-day-header"
        data-date={day.dateKey}
        title={calendarDayProps?.title}
        style={{ ...calendarDayProps?.style, height: day.settings.dayHeaderHeight, minWidth: dayWidth }}
      >
        <div
          className={[
            "quno-calendar-left-label",
            "quno-calendar-date-label",
            "icv-date-label",
            calendarDayProps?.className
          ]
            .filter(Boolean)
            .join(" ")}
          data-slot="calendar-day-label"
          style={{ ...calendarDayProps?.style, width: day.labelWidth }}
          title={calendarDayProps?.title}
        >
          {customDayName === null ? (
            <>
              <span className="icv-date-main">{formatMonthDayOrdinal({ date, options: day })}</span>
              <span className="icv-date-weekday">{formatWeekday({ date, options: day })}</span>
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
            const customProps = calendarCellProps.get(calendar.id);
            return (
              <div
                className={["icv-calendar-header-cell", customProps?.className].filter(Boolean).join(" ")}
                data-slot="calendar-cell-label"
                data-retained-hidden={isHidden ? "true" : undefined}
                aria-hidden={isHidden || undefined}
                style={{
                  ...customProps?.style,
                  visibility: isHidden ? "hidden" : undefined,
                  pointerEvents: isHidden ? "none" : undefined,
                  gridColumn: resourceIndex + 1
                }}
                title={customProps?.title}
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
          <CalendarHourBands hours={day.calendarHourPresentations} orientation="vertical" settings={day.settings} />
          <div
            className="icv-time-tick-track"
            style={{
              top: VERTICAL_TIMELINE_GUTTER_PX,
              height: day.boardHeight - VERTICAL_TIMELINE_GUTTER_PX * 2
            }}
          >
            {day.timeTicks.map((tick) => {
              const hourProps = tick.isHour
                ? calendarHourLabelProps({ hours: day.calendarHourPresentations, minute: tick.minute })
                : undefined;
              return (
                <span
                  className={[
                    "icv-time-tick",
                    tick.isHour ? "is-hour" : "",
                    tick.showLabel ? "" : "is-label-hidden",
                    hourProps?.className
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  data-slot={hourProps ? "calendar-hour-label" : undefined}
                  data-hour={hourProps ? tick.minute / 60 : undefined}
                  key={`${day.dateKey}-time-${tick.minute}`}
                  aria-hidden={!tick.showLabel}
                  style={{ ...hourProps?.style, top: `${tick.positionPercent}%` }}
                  title={hourProps?.title}
                >
                  {formatVerticalTimeTick({ minute: tick.minute, isHour: tick.isHour })}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function formatVerticalTimeTick({ minute, isHour }: { minute: number; isHour: boolean }): string {
  return isHour ? `${Math.floor(minute / 60)}:00` : String(minute % 60);
}
