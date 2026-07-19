/**
 * Domain: Rendering.
 * Responsibility: Hosts the external renderer inside geometry- and status-controlled shell layers.
 * Preserves: stable geometry, layering, clipping, and external renderer isolation.
 * Does not own: requests, controlled settings, and scroll correction.
 * Failure/cancellation: missing optional content leaves structural calendar geometry intact.
 *
 * @see docs/domains/rendering.md#source-map
 */
import { memo, useCallback, useRef, type CSSProperties, type PointerEvent } from "react";
import type { CalendarEvent, CalendarId, EventRenderer, EventRenderStatus } from "../../../core/types";
import type { ViewportGeometryRegistration } from "../../anchors/parent/viewportAnchorTypes";

type CssLength = number | string;
type RgbColor = { red: number; green: number; blue: number };

const DEFAULT_EVENT_ACCENT = "#0b6eff";
const MUTED_EVENT_ACCENT_MIX = 0.14;

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
  geometryRegistration?: ViewportGeometryRegistration;
  disableDrag?: boolean;
  isExiting?: boolean;
  releaseDurationMs?: number;
  onEventPointerDown?: (
    event: PointerEvent<HTMLDivElement>,
    calendarEvent: CalendarEvent,
    renderedCalendarId: CalendarId
  ) => void;
};

type EventRendererContentProps = Pick<
  EventShellProps,
  "event" | "status" | "lane" | "laneCount" | "isOverlapping" | "eventRenderer"
>;

/** Keeps product-owned card rendering independent from shell geometry updates. */
const EventRendererContent = memo(function EventRendererContent({
  event,
  status,
  lane,
  laneCount,
  isOverlapping,
  eventRenderer
}: EventRendererContentProps) {
  return eventRenderer({
    event,
    status,
    style: { width: "100%", height: "100%" },
    lane,
    laneCount,
    isOverlapping
  });
});

/**
 * Positioned wrapper that isolates calendar geometry from the external card renderer.
 *
 * @see docs/architecture.md#render-layers
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
  geometryRegistration,
  disableDrag = false,
  isExiting = false,
  releaseDurationMs,
  onEventPointerDown
}: EventShellProps) {
  const registeredElementRef = useRef<HTMLDivElement | null>(null);
  const registerEventElement = useCallback(
    (element: HTMLDivElement | null) => {
      const previousElement = registeredElementRef.current;
      registeredElementRef.current = element;
      geometryRegistration?.registerEventElement(event.id, renderedCalendarId, element, previousElement);
    },
    [event.id, geometryRegistration, renderedCalendarId]
  );

  return (
    <div
      className={["ic-event-shell", status === "hovered" ? "is-hovered" : "", className].filter(Boolean).join(" ")}
      data-event-id={event.id}
      data-calendar-id={renderedCalendarId}
      data-lane-count={laneCount}
      data-exiting={isExiting ? "true" : undefined}
      data-testid={testId}
      ref={registerEventElement}
      onPointerDown={(pointerEvent) => !disableDrag && onEventPointerDown?.(pointerEvent, event, renderedCalendarId)}
      style={
        {
          left,
          top,
          width,
          height,
          zIndex,
          "--event-width": toCssLength(width),
          "--event-hover-width": toCssLength(hoverMaxWidth),
          "--event-accent": event.color ?? DEFAULT_EVENT_ACCENT,
          "--event-accent-muted": mutedEventAccent(event.color ?? DEFAULT_EVENT_ACCENT),
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
        eventRenderer={eventRenderer}
      />
    </div>
  );
}, areEventShellPropsEqual);

function toCssLength(value: CssLength): string {
  return typeof value === "number" ? `${value}px` : value;
}

function mutedEventAccent(accent: string): string {
  const rgb = parseHexColor(accent);
  if (!rgb) {
    return `color-mix(in srgb, ${accent} ${MUTED_EVENT_ACCENT_MIX * 100}%, white)`;
  }
  return `rgb(${blendWithWhite(rgb.red)}, ${blendWithWhite(rgb.green)}, ${blendWithWhite(rgb.blue)})`;
}

function blendWithWhite(channel: number): number {
  return Math.round(channel * MUTED_EVENT_ACCENT_MIX + 255 * (1 - MUTED_EVENT_ACCENT_MIX));
}

function parseHexColor(color: string): RgbColor | null {
  const normalized = color.trim();
  const shortMatch = /^#([0-9a-f]{3})$/i.exec(normalized);
  if (shortMatch) {
    const [, value] = shortMatch;
    return {
      red: Number.parseInt(value[0] + value[0], 16),
      green: Number.parseInt(value[1] + value[1], 16),
      blue: Number.parseInt(value[2] + value[2], 16)
    };
  }

  const longMatch = /^#([0-9a-f]{6})$/i.exec(normalized);
  if (!longMatch) {
    return null;
  }
  const [, value] = longMatch;
  return {
    red: Number.parseInt(value.slice(0, 2), 16),
    green: Number.parseInt(value.slice(2, 4), 16),
    blue: Number.parseInt(value.slice(4, 6), 16)
  };
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
    previous.isExiting === next.isExiting &&
    previous.releaseDurationMs === next.releaseDurationMs &&
    previous.eventRenderer === next.eventRenderer &&
    previous.geometryRegistration === next.geometryRegistration
  );
}
