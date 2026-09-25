import { memo, useCallback, useRef, type CSSProperties, type PointerEvent } from "react";
import type { CalendarEvent, CalendarId, EventRenderer, EventRenderStatus } from "#quno-internal/timeline/core/types";
import type { ViewportGeometryRegistration } from "#quno-internal/timeline/infinite/anchors/parent/viewportAnchorTypes";

export type CssLength = number | string;

export type EventShellProps = {
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
  renderEvent: EventRenderer;
  geometryRegistration?: ViewportGeometryRegistration;
  disableDrag?: boolean;
  isExiting?: boolean;
  releaseDurationMs?: number;
  onEventPointerDown?: (args: {
    event: PointerEvent<HTMLDivElement>;
    calendarEvent: CalendarEvent;
    renderedCalendarId: CalendarId;
  }) => void;
};

type EventRendererContentProps = Pick<
  EventShellProps,
  "event" | "status" | "lane" | "laneCount" | "isOverlapping" | "renderEvent"
>;

/** Keeps product-owned card rendering independent from shell geometry updates. */
const EventRendererContent = memo(function EventRendererContent({
  event,
  status,
  lane,
  laneCount,
  isOverlapping,
  renderEvent: RenderEvent
}: EventRendererContentProps) {
  return (
    <RenderEvent
      event={event}
      status={status}
      style={{ width: "100%", height: "100%" }}
      lane={lane}
      laneCount={laneCount}
      isOverlapping={isOverlapping}
    />
  );
});

/**
 * Positioned wrapper that isolates calendar geometry from the external card renderer.
 *
 * @see docs/infinite-calendar/architecture.md#render-layers
 */
export const EventShell = memo(
  function EventShell({
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
    renderEvent,
    geometryRegistration,
    disableDrag = false,
    isExiting = false,
    releaseDurationMs,
    onEventPointerDown
  }: EventShellProps) {
    const registeredElementRef = useRef<HTMLDivElement | null>(null);
    const registerEventElement = useCallback<import("react").RefCallback<HTMLDivElement>>(
      (element: HTMLDivElement | null) => {
        const previousElement = registeredElementRef.current;
        registeredElementRef.current = element;
        geometryRegistration?.registerEventElement({
          eventId: event.id,
          calendarId: renderedCalendarId,
          element,
          previousElement
        });
      },
      [event.id, geometryRegistration, renderedCalendarId]
    );

    return (
      <div
        className={[
          "quno-calendar-event-shell",
          status === "hovered" ? "is-hovered" : "",
          status === "focused" ? "is-focused" : "",
          !disableDrag ? "is-interactive" : "",
          className
        ]
          .filter(Boolean)
          .join(" ")}
        data-event-id={event.id}
        data-calendar-id={renderedCalendarId}
        data-status={status}
        data-lane-count={laneCount}
        data-exiting={isExiting ? "true" : undefined}
        data-testid={testId}
        ref={registerEventElement}
        onPointerDown={(pointerEvent) =>
          !disableDrag && onEventPointerDown?.({ event: pointerEvent, calendarEvent: event, renderedCalendarId })
        }
        style={
          {
            left,
            top,
            width,
            height,
            zIndex,
            "--event-width": toCssLength({ value: width }),
            "--event-hover-width": toCssLength({ value: hoverMaxWidth }),
            "--event-accent": event.color ?? "var(--quno-calendar-event-accent, var(--_ic-default-event-accent))",
            "--event-accent-muted":
              "color-mix(in srgb, var(--event-accent) 14%, var(--quno-calendar-surface, var(--_ic-default-surface)))",
            "--draft-release-duration": releaseDurationMs ? `${releaseDurationMs}ms` : undefined
          } as CSSProperties
        }
      >
        <EventRendererContent
          event={event}
          status={status}
          lane={lane}
          laneCount={laneCount}
          isOverlapping={isOverlapping}
          renderEvent={renderEvent}
        />
      </div>
    );
  },
  (argument0, argument1) => areEventShellPropsEqual({ previous: argument0, next: argument1 })
);

function toCssLength({ value }: { value: CssLength }): string {
  return typeof value === "number" ? `${value}px` : value;
}

/** Keeps unchanged external event cards from re-rendering during unrelated drag/scroll state changes. */
function areEventShellPropsEqual({ previous, next }: { previous: EventShellProps; next: EventShellProps }): boolean {
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
    previous.isExiting === next.isExiting &&
    previous.releaseDurationMs === next.releaseDurationMs &&
    previous.renderEvent === next.renderEvent &&
    previous.geometryRegistration === next.geometryRegistration
  );
}
