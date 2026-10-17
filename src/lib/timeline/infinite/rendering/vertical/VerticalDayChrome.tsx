/**
 * Vertical day chrome.
 * date/ticks/resources -> sticky date header + resource header + time scale
 */
import { formatMonthDayOrdinal, formatWeekday } from "#quno-internal/timeline/date/dateLabels";
import { fromDateKey } from "#quno-internal/timeline/date/dateVirtualization";
import { VerticalTimePane } from "./VerticalTimePane";
import type { QunoInfiniteCalendarCellProps, QunoInfiniteCalendarDayProps } from "#quno-internal/timeline/core/types";
import type { VerticalTimelineDayProps } from "./types";

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
      <VerticalTimePane
        dateKey={day.dateKey}
        labelWidth={day.labelWidth}
        boardHeight={day.boardHeight}
        settings={day.settings}
        timeTicks={day.timeTicks}
        calendarHourPresentations={day.calendarHourPresentations}
      />
    </>
  );
}
