import { memo } from "react";
import type { VerticalTimelineDayProps } from "./types";
import { VERTICAL_TIMELINE_GUTTER_PX } from "./verticalGeometry";
import {
  CalendarHourBands,
  calendarHourLabelProps
} from "#quno-internal/timeline/infinite/rendering/shared/CalendarHourBands";

type TimePaneProps = Pick<
  VerticalTimelineDayProps,
  "dateKey" | "labelWidth" | "boardHeight" | "settings" | "timeTicks" | "calendarHourPresentations"
>;

/** Resource window movement does not invalidate the date's time labels. */
export const VerticalTimePane = memo(function VerticalTimePane(day: TimePaneProps) {
  return (
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
                style={{
                  ...hourProps?.style,
                  top: `${tick.positionPercent}%`
                }}
                title={hourProps?.title}
              >
                {formatVerticalTimeTick({ minute: tick.minute, isHour: tick.isHour })}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
});

function formatVerticalTimeTick({ minute, isHour }: { minute: number; isHour: boolean }): string {
  return isHour ? `${Math.floor(minute / 60)}:00` : String(minute % 60);
}
