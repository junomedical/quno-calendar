import { memo, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import type {
  CalendarEvent,
  CalendarId,
  EventRenderer,
  EventRenderStatus
} from "../../core/types";

type CssLength = number | string;

type EventShellProps = {
  event: CalendarEvent;
  status: EventRenderStatus;
  left: CssLength;
  top: CssLength;
  width: CssLength;
  hoverMaxWidth: CssLength;
  height: CssLength;
  zIndex: number;
  lane: number;
  laneCount: number;
  isOverlapping: boolean;
  testId: string;
  renderedCalendarId: CalendarId;
  className?: string;
  eventRenderer: EventRenderer;
  disableDrag?: boolean;
  onEventPointerDown?: (
    event: PointerEvent<HTMLDivElement>,
    calendarEvent: CalendarEvent,
    renderedCalendarId: CalendarId
  ) => void;
  onEventMouseDown?: (
    event: MouseEvent<HTMLDivElement>,
    calendarEvent: CalendarEvent,
    renderedCalendarId: CalendarId
  ) => void;
  onPointerMove?: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: () => void;
  onMouseMove?: (event: MouseEvent<HTMLDivElement>) => void;
  onMouseUp?: () => void;
};

/**
 * Positioned wrapper that isolates calendar geometry from the external card renderer.
 *
 * @see docs/architecture.md#event-renderer-contract
 */
export const EventShell = memo(function EventShell({
  event,
  status,
  left,
  top,
  width,
  hoverMaxWidth,
  height,
  zIndex,
  lane,
  laneCount,
  isOverlapping,
  testId,
  renderedCalendarId,
  className,
  eventRenderer,
  disableDrag = false,
  onEventPointerDown,
  onEventMouseDown,
  onPointerMove,
  onPointerUp,
  onMouseMove,
  onMouseUp
}: EventShellProps) {
  return (
    <div
      className={["ic-event-shell", status === "hovered" ? "is-hovered" : "", className].filter(Boolean).join(" ")}
      data-event-id={event.id}
      data-calendar-id={renderedCalendarId}
      data-lane-count={laneCount}
      data-testid={testId}
      onPointerDown={(pointerEvent) => !disableDrag && onEventPointerDown?.(pointerEvent, event, renderedCalendarId)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onMouseDown={(mouseEvent) => !disableDrag && onEventMouseDown?.(mouseEvent, event, renderedCalendarId)}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      style={
        {
          left,
          top,
          width,
          height,
          zIndex,
          "--event-width": toCssLength(width),
          "--event-hover-width": toCssLength(hoverMaxWidth),
          "--event-accent": event.color ?? "#0b6eff"
        } as CSSProperties
      }
    >
      {eventRenderer({
        event,
        status,
        style: { width: "100%", height: "100%" },
        lane,
        laneCount,
        isOverlapping
      })}
    </div>
  );
}, areEventShellPropsEqual);

function toCssLength(value: CssLength): string {
  return typeof value === "number" ? `${value}px` : value;
}

/** Keeps unchanged external event cards from re-rendering during unrelated drag/scroll state changes. */
function areEventShellPropsEqual(previous: EventShellProps, next: EventShellProps): boolean {
  return (
    previous.event === next.event &&
    previous.status === next.status &&
    previous.left === next.left &&
    previous.top === next.top &&
    previous.width === next.width &&
    previous.hoverMaxWidth === next.hoverMaxWidth &&
    previous.height === next.height &&
    previous.zIndex === next.zIndex &&
    previous.lane === next.lane &&
    previous.laneCount === next.laneCount &&
    previous.isOverlapping === next.isOverlapping &&
    previous.testId === next.testId &&
    previous.renderedCalendarId === next.renderedCalendarId &&
    previous.className === next.className &&
    previous.disableDrag === next.disableDrag &&
    previous.eventRenderer === next.eventRenderer
  );
}
