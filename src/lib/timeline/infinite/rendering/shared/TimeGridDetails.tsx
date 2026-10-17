import type { CSSProperties } from "react";
import type { QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { fineGridOpacity, TIMELINE_LEFT_GUTTER_PX } from "#quno-internal/timeline/time/timelineTicks";
import { VERTICAL_TIMELINE_GUTTER_PX } from "#quno-internal/timeline/infinite/rendering/vertical/verticalGeometry";

/** Shared CSS opacity input; the stylesheet can bypass partial opacity for reduced motion. */
export function timeDetailOpacityStyle({
  opacity
}: {
  opacity: number;
}): CSSProperties & { "--_ic-time-detail-opacity": number } {
  return { "--_ic-time-detail-opacity": opacity };
}

/** Keeps detail nodes stable while opacity follows the committed zoom directly. */
export function TimeGridDetails({
  settings,
  orientation
}: {
  settings: QunoInfiniteCalendarSettings;
  orientation: "horizontal" | "vertical";
}) {
  const horizontal = orientation === "horizontal";
  const step = settings.zoom * 5;
  const opacity = fineGridOpacity({ zoom: settings.zoom });
  const border = "var(--quno-calendar-cell-border, var(--_ic-default-cell-border))";
  return (
    <div
      className={`quno-calendar-time-detail quno-calendar-time-grid-detail${opacity > 0 ? "" : " is-label-hidden"}`}
      aria-hidden="true"
      style={{
        ...timeDetailOpacityStyle({ opacity }),
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        backgroundImage: `linear-gradient(to ${horizontal ? "right" : "bottom"}, transparent ${step}px, ${border} ${step}px ${step + 1}px, transparent ${step + 1}px ${step * 2}px, ${border} ${step * 2}px ${step * 2 + 1}px, transparent ${step * 2 + 1}px)`,
        backgroundSize: horizontal ? `${step * 3}px 100%` : `100% ${step * 3}px`,
        backgroundPosition: horizontal ? `${TIMELINE_LEFT_GUTTER_PX}px 0` : `0 ${VERTICAL_TIMELINE_GUTTER_PX}px`
      }}
    />
  );
}
