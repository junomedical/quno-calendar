import { useCallback, type PropsWithChildren, type PointerEvent } from "react";
import type { CalendarId, CalendarRow, QunoInfiniteCalendarSettings } from "#quno-internal/timeline/core/types";
import { minuteToX } from "#quno-internal/timeline/time/time";
import { TIMELINE_LEFT_GUTTER_PX } from "#quno-internal/timeline/time/timelineTicks";
import type { ViewportGeometryRegistration } from "#quno-internal/timeline/infinite/anchors/parent/viewportAnchorTypes";
import type { HorizontalRowLayoutItems } from "./types";

/** Row chrome: resource label + time grid + hover hit surface around event layers. */

type HorizontalRowFrameProps = PropsWithChildren<{
  calendar: CalendarRow;
  dateKey: string;
  top: number;
  rowHeight: number;
  isHidden: boolean;
  settings: QunoInfiniteCalendarSettings;
  timelineWidth: number;
  gridCellWidth: number;
  eventCount: number;
  showNowLine: boolean;
  nowLineClassName: "is-current" | "is-reference";
  nowMinute: number;
  layoutItems: HorizontalRowLayoutItems;
  geometryRegistration: ViewportGeometryRegistration;
  onHoverMove: (
    event: PointerEvent<HTMLDivElement>,
    layoutItems: HorizontalRowLayoutItems,
    renderedCalendarId: CalendarId,
    rowHeight: number
  ) => void;
  onHoverLeave: () => void;
}>;

export function HorizontalRowFrame({
  calendar,
  dateKey,
  top,
  rowHeight,
  isHidden,
  settings,
  timelineWidth,
  gridCellWidth,
  eventCount,
  showNowLine,
  nowLineClassName,
  nowMinute,
  layoutItems,
  geometryRegistration,
  onHoverMove,
  onHoverLeave,
  children
}: HorizontalRowFrameProps) {
  const setResourceElement = useCallback(
    (element: HTMLDivElement | null) => geometryRegistration.registerResourceElement(dateKey, calendar.id, element),
    [calendar.id, dateKey, geometryRegistration]
  );

  return (
    <div
      className="quno-calendar-row"
      data-testid="calendar-row"
      data-calendar-id={calendar.id}
      data-retained-hidden={isHidden ? "true" : undefined}
      aria-hidden={isHidden || undefined}
      ref={setResourceElement}
      style={{
        top,
        height: rowHeight,
        visibility: isHidden ? "hidden" : undefined,
        pointerEvents: isHidden ? "none" : undefined
      }}
    >
      <div className="quno-calendar-left-label quno-calendar-row-label" style={{ width: settings.labelWidth }}>
        {calendar.name}
      </div>
      <div
        className="quno-calendar-row-grid"
        data-event-count={eventCount}
        onMouseLeave={onHoverLeave}
        onPointerMove={(event) => onHoverMove(event, layoutItems, calendar.id, rowHeight)}
        style={{
          left: settings.labelWidth,
          width: TIMELINE_LEFT_GUTTER_PX + timelineWidth,
          height: rowHeight,
          backgroundImage:
            "linear-gradient(to right, var(--quno-calendar-cell-border, var(--_ic-default-cell-border)) 1px, transparent 1px)",
          backgroundPosition: `${TIMELINE_LEFT_GUTTER_PX}px 0`,
          backgroundRepeat: "repeat",
          backgroundSize: `${gridCellWidth}px 100%`
        }}
      >
        {showNowLine ? (
          <div
            className={`quno-calendar-now-line ${nowLineClassName}`}
            data-testid="current-time-line"
            style={{ left: TIMELINE_LEFT_GUTTER_PX + minuteToX(nowMinute, settings) }}
          />
        ) : null}
        {children}
      </div>
    </div>
  );
}
