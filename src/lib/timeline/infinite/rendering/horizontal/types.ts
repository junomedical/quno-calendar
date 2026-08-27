import type { Key, PointerEvent, RefCallback } from "react";
import type {
  CalendarEvent,
  CalendarId,
  CalendarRow,
  CalendarViewportAnchorTarget,
  EventRenderer,
  EventRenderStatus,
  QunoInfiniteCalendarCellCustomizer,
  QunoInfiniteCalendarCellProps,
  QunoInfiniteCalendarSettings
} from "#quno-internal/timeline/core/types";
import type {
  PreparedEventCell,
  layoutPreparedEventsForRow
} from "#quno-internal/timeline/infinite/events/layout/layout";
import type { ViewportGeometryRegistration } from "#quno-internal/timeline/infinite/anchors/parent/viewportAnchorTypes";
import type { ViewportMetricsStore } from "#quno-internal/timeline/infinite/scroll/resources/viewportMetricsStore";
import type { CalendarFocusedEventTarget } from "#quno-internal/timeline/core/internalTypes";

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
  settings: QunoInfiniteCalendarSettings;
  width: number;
  selectedCalendars: CalendarRow[];
  hiddenCalendarIds: Set<CalendarId>;
  todayKey: string;
  getCalendarCellProps?: QunoInfiniteCalendarCellCustomizer;
  showNowLine: boolean;
  nowMinute: number;
  interactionMode: "events" | "availability";
  hoveredEvent: HoveredEvent;
  dragEventId?: string;
  appearingEventIds: Set<string>;
  focusedEventTarget?: CalendarFocusedEventTarget | null;
  eventInteractionEnabled: boolean;
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
  forceAllResources: boolean;
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
  calendarCellProps?: QunoInfiniteCalendarCellProps;
  settings: QunoInfiniteCalendarSettings;
  width: number;
  showNowLine: boolean;
  nowLineClassName: "is-current" | "is-reference";
  nowMinute: number;
  interactionMode: "events" | "availability";
  hoveredEvent: HoveredEvent;
  dragEventId?: string;
  appearingEventIds: Set<string>;
  focusedEventTarget?: CalendarFocusedEventTarget | null;
  eventInteractionEnabled: boolean;
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
