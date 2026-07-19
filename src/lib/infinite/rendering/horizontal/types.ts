/**
 * Domain: Rendering.
 * Responsibility: Defines prepared render contracts shared by horizontal layers.
 * Preserves: stable geometry, layering, clipping, and external renderer isolation.
 * Does not own: requests, controlled settings, and scroll correction.
 * Failure/cancellation: missing optional content leaves structural calendar geometry intact.
 *
 * @see docs/domains/rendering.md#source-map
 */
import type { Key, PointerEvent, RefCallback } from "react";
import type {
  CalendarEvent,
  CalendarId,
  CalendarRow,
  CalendarViewportAnchorTarget,
  EventRenderer,
  EventRenderStatus,
  TimelineSettings
} from "../../../core/types";
import type { PreparedEventCell, layoutPreparedEventsForRow } from "../../events/layout/layout";
import type { ViewportGeometryRegistration } from "../../anchors/parent/viewportAnchorTypes";
import type { ViewportMetricsStore } from "../../scroll/resources/viewportMetricsStore";

/** Shared horizontal-render contracts: view coordinator -> day -> row -> event layers. */

export type VirtualDayItem = {
  key: Key;
  index: number;
  start: number;
};

export type HoveredEvent = { eventId: string; calendarId: CalendarId } | null;
export type HorizontalRowLayoutItems = ReturnType<typeof layoutPreparedEventsForRow>;

export type HorizontalEventPointerDown = (
  event: PointerEvent<HTMLDivElement>,
  calendarEvent: CalendarEvent,
  renderedCalendarId: CalendarId
) => void;

export type HorizontalTimelineDayProps = {
  item: VirtualDayItem;
  dateKey: string;
  dayHeight: number;
  settings: TimelineSettings;
  width: number;
  selectedCalendars: CalendarRow[];
  hiddenCalendarIds: Set<CalendarId>;
  todayKey: string;
  showNowLine: boolean;
  nowMinute: number;
  interactionMode: "events" | "availability";
  hoveredEvent: HoveredEvent;
  dragEventId?: string;
  appearingEventIds: Set<string>;
  dragPreviewEvent: CalendarEvent | null;
  draftEvent: CalendarEvent | null;
  activeRestoreTarget: CalendarViewportAnchorTarget | null;
  draftEventStatus: EventRenderStatus;
  draftEventIsDraggable: boolean;
  draftEventIsExiting: boolean;
  draftEventReleaseDurationMs?: number;
  eventRenderer: EventRenderer;
  geometryRegistration: ViewportGeometryRegistration;
  viewportMetricsStore: ViewportMetricsStore;
  measureElement: RefCallback<HTMLDivElement>;
  getRowHeight: (dateKey: string, calendarId: CalendarId) => number;
  eventsForRow: (dateKey: string, calendarId: CalendarId) => CalendarEvent[];
  preparedCellForRow: (dateKey: string, calendarId: CalendarId) => PreparedEventCell;
  onHoverMove: (
    event: PointerEvent<HTMLDivElement>,
    layoutItems: HorizontalRowLayoutItems,
    renderedCalendarId: CalendarId,
    rowHeight: number
  ) => void;
  onHoverLeave: () => void;
  onEventPointerDown: HorizontalEventPointerDown;
};

export type HorizontalTimelineRowProps = {
  calendar: CalendarRow;
  dateKey: string;
  top: number;
  rowHeight: number;
  rowEvents: CalendarEvent[];
  preparedCell: PreparedEventCell;
  isHidden?: boolean;
  settings: TimelineSettings;
  width: number;
  showNowLine: boolean;
  nowLineClassName: "is-current" | "is-reference";
  nowMinute: number;
  interactionMode: "events" | "availability";
  hoveredEvent: HoveredEvent;
  dragEventId?: string;
  appearingEventIds: Set<string>;
  dragPreviewEvent: CalendarEvent | null;
  draftEvent: CalendarEvent | null;
  draftEventStatus: EventRenderStatus;
  draftEventIsDraggable: boolean;
  draftEventIsExiting: boolean;
  draftEventReleaseDurationMs?: number;
  eventRenderer: EventRenderer;
  geometryRegistration: ViewportGeometryRegistration;
  onHoverMove: (
    event: PointerEvent<HTMLDivElement>,
    layoutItems: HorizontalRowLayoutItems,
    renderedCalendarId: CalendarId,
    rowHeight: number
  ) => void;
  onHoverLeave: () => void;
  onEventPointerDown: HorizontalEventPointerDown;
};

export type HorizontalEventLayerSharedProps = Pick<
  HorizontalTimelineRowProps,
  "calendar" | "rowHeight" | "settings" | "eventRenderer" | "geometryRegistration" | "onEventPointerDown"
>;
