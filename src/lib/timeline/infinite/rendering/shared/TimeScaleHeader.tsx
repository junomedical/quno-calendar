import { minuteToX } from "#quno-internal/timeline/time/time";
import type { QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { TIMELINE_LEFT_GUTTER_PX } from "#quno-internal/timeline/time/timelineTicks";

type TimeTick = {
  minute: number;
  positionPercent: number;
  label: string;
  isHour: boolean;
  showLabel: boolean;
};

type InfiniteTimeScaleHeaderProps = {
  settings: QunoInfiniteCalendarSettings;
  width: number;
  timeTicks: TimeTick[];
  showNowLine: boolean;
  nowMinute: number;
};

/**
 * Renders the single sticky time scale used above all virtualized day sections.
 *
 * @see docs/infinite-calendar/architecture.md#styling-and-packaging
 */
export function InfiniteTimeScaleHeader({
  settings,
  width,
  timeTicks,
  showNowLine,
  nowMinute
}: InfiniteTimeScaleHeaderProps) {
  return (
    <div
      className="quno-calendar-time-scale-header"
      data-testid="time-scale-header"
      style={{
        height: settings.dayHeaderHeight,
        minWidth: settings.labelWidth + TIMELINE_LEFT_GUTTER_PX + width
      }}
    >
      <div
        className="quno-calendar-time-header"
        style={{
          left: settings.labelWidth,
          width: TIMELINE_LEFT_GUTTER_PX + width
        }}
      >
        {showNowLine ? (
          <div
            className="quno-calendar-now-pin is-current"
            style={{ left: TIMELINE_LEFT_GUTTER_PX + minuteToX(nowMinute, settings) }}
          />
        ) : null}
        {showNowLine ? (
          <div
            className="quno-calendar-now-header-line is-current"
            style={{ left: TIMELINE_LEFT_GUTTER_PX + minuteToX(nowMinute, settings) }}
          />
        ) : null}
        <div className="quno-calendar-time-tick-track" style={{ left: TIMELINE_LEFT_GUTTER_PX, width, height: "100%" }}>
          {timeTicks.map((tick) => (
            <span
              className={[
                "quno-calendar-time-tick",
                tick.isHour ? "is-hour" : "",
                tick.showLabel ? "" : "is-label-hidden"
              ]
                .filter(Boolean)
                .join(" ")}
              key={`sticky-${tick.minute}`}
              aria-hidden={!tick.showLabel}
              style={{ left: `${tick.positionPercent}%` }}
            >
              {tick.isHour ? tick.label : <sup>{tick.label}</sup>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
