import { minuteToX } from "../../time/time";
import type { TimelineSettings } from "../../core/types";
import { TIMELINE_LEFT_GUTTER_PX } from "../utils/infiniteTimelineUtils";

type TimeTick = {
  minute: number;
  x: number;
  label: string;
  isHour: boolean;
  showLabel: boolean;
};

type InfiniteTimeScaleHeaderProps = {
  settings: TimelineSettings;
  width: number;
  timeTicks: TimeTick[];
  showNowLine: boolean;
  nowMinute: number;
};

/**
 * Renders the single sticky time scale used above all virtualized day sections.
 *
 * @see docs/architecture.md#sticky-headers-and-current-time
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
      className="ic-time-scale-header"
      data-testid="time-scale-header"
      style={{
        height: settings.dayHeaderHeight,
        minWidth: settings.labelWidth + TIMELINE_LEFT_GUTTER_PX + width
      }}
    >
      <div
        className="ic-time-header"
        style={{
          left: settings.labelWidth,
          width: TIMELINE_LEFT_GUTTER_PX + width
        }}
      >
        {showNowLine ? (
          <div
            className="ic-now-pin is-current"
            style={{ left: TIMELINE_LEFT_GUTTER_PX + minuteToX(nowMinute, settings) }}
          />
        ) : null}
        {showNowLine ? (
          <div
            className="ic-now-header-line is-current"
            style={{ left: TIMELINE_LEFT_GUTTER_PX + minuteToX(nowMinute, settings) }}
          />
        ) : null}
        {timeTicks.map((tick) => (
          <span
            className={[
              "ic-time-tick",
              tick.isHour ? "is-hour" : "",
              tick.showLabel ? "" : "is-label-hidden"
            ]
              .filter(Boolean)
              .join(" ")}
            key={`sticky-${tick.minute}`}
            aria-hidden={!tick.showLabel}
            style={{ left: TIMELINE_LEFT_GUTTER_PX + tick.x }}
          >
            {tick.showLabel && tick.isHour ? tick.label : null}
            {tick.showLabel && !tick.isHour ? <sup>{tick.label}</sup> : null}
          </span>
        ))}
      </div>
    </div>
  );
}
