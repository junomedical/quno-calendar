import type { CalendarDateLabelOptions } from "#quno-internal/timeline/core/calendarFormatterTypes";
/**
 * Vertical render contracts.
 * view coordinator -> day contract -> column and interaction contracts
 */
import type { PointerEvent as ReactPointerEvent } from "react";
import type { CalendarHourPresentation } from "#quno-internal/timeline/core/calendarCellPresentation";
import type {
  CalendarEvent,
  CalendarId,
  CalendarRow,
  CalendarViewportAnchorTarget,
  EventRenderer,
  EventRenderStatus,
  QunoInfiniteCalendarCellCustomizer,
  QunoInfiniteCalendarCellProps,
  QunoInfiniteCalendarDayCustomizer,
  QunoInfiniteCalendarSettings
} from "#quno-internal/timeline/core/types";
import type { EventColumnLayoutItem, PreparedEventCell } from "#quno-internal/timeline/infinite/events/layout/layout";
import type { buildTimeTicks } from "#quno-internal/timeline/time/timelineTicks";
import type { ViewportGeometryRegistration } from "#quno-internal/timeline/infinite/anchors/parent/viewportAnchorTypes";
import type { ViewportMetricsStore } from "#quno-internal/timeline/infinite/scroll/resources/viewportMetricsStore";
import type { CalendarFocusedEventTarget } from "#quno-internal/timeline/core/internalTypes";

export type VerticalHoveredEvent = {
  eventId: string;
  calendarId: CalendarId;
} | null;

export type VerticalHoverMove = (args: {
  event: ReactPointerEvent<HTMLDivElement>;
  layoutItems: EventColumnLayoutItem[];
  renderedCalendarId: CalendarId;
}) => void;

export type VerticalEventPointerDown = (args: {
  event: ReactPointerEvent<HTMLDivElement>;
  calendarEvent: CalendarEvent;
  renderedCalendarId: CalendarId;
}) => void;

/** Input contract for a single virtualized vertical date section. */
export type VerticalTimelineDayProps = CalendarDateLabelOptions & {
  dayIndex: number;
  dateKey: string;
  top: number;
  dayHeight: number;
  boardHeight: number;
  boardMinWidth: number;
  virtualBoardMinWidth: number;
  labelWidth: number;
  settings: QunoInfiniteCalendarSettings;
  selectedCalendars: CalendarRow[];
  hiddenCalendarIds: Set<CalendarId>;
  timeTicks: ReturnType<typeof buildTimeTicks>;
  todayKey: string;
  getDayCellProps?: QunoInfiniteCalendarCellCustomizer;
  getDayProps?: QunoInfiniteCalendarDayCustomizer;
  calendarHourPresentations: CalendarHourPresentation[];
  showNowLine: boolean;
  nowMinute: number;
  interactionMode: "events" | "availability";
  hoveredEvent: VerticalHoveredEvent;
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
  renderEvent: EventRenderer;
  geometryRegistration: ViewportGeometryRegistration;
  viewportMetricsStore: ViewportMetricsStore;
  forceAllResources: boolean;
  eventsForColumn: (args: { dateKey: string; calendarId: CalendarId }) => CalendarEvent[];
  preparedCellForColumn: (args: { dateKey: string; calendarId: CalendarId }) => PreparedEventCell;
  columnWidthForDateCalendar: (args: { dateKey: string; calendarId: CalendarId }) => number;
  onHoverMove: VerticalHoverMove;
  onHoverLeave: () => void;
  onEventPointerDown: VerticalEventPointerDown;
};

/** Rendering contract for one mounted resource column. */
export type VerticalCalendarColumnProps = {
  calendar: CalendarRow;
  dateKey: string;
  rowEvents: CalendarEvent[];
  preparedCell: PreparedEventCell;
  isHidden?: boolean;
  calendarCellProps?: QunoInfiniteCalendarCellProps;
  calendarHourPresentations: CalendarHourPresentation[];
  settings: QunoInfiniteCalendarSettings;
  boardHeight: number;
  gridCellHeight: number;
  interactionMode: "events" | "availability";
  hoveredEvent: VerticalHoveredEvent;
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
  renderEvent: EventRenderer;
  geometryRegistration: ViewportGeometryRegistration;
  gridColumn: number;
  isAlternate: boolean;
  onHoverMove: VerticalHoverMove;
  onHoverLeave: () => void;
  onEventPointerDown: VerticalEventPointerDown;
};
