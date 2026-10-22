import type { CalendarFocusedEventTarget } from "#quno-internal/timeline/core/internalTypes";
import type { CalendarEvent, CalendarId, EventRenderer, EventRenderStatus } from "#quno-internal/timeline/core/types";
import type { ViewportGeometryRegistration } from "#quno-internal/timeline/infinite/anchors/parent/viewportAnchorTypes";
import type { EventShellProps } from "./EventShell";

export type EventProjection = Pick<EventShellProps, "left" | "top" | "width" | "hoverMaxWidth" | "height">;
export type CommittedItem = Pick<EventShellProps, "event" | "segment" | "lane" | "laneCount" | "isOverlapping">;
export type SharedLayerProps = {
  calendarId: CalendarId;
  renderEvent: EventRenderer;
  geometryRegistration: ViewportGeometryRegistration;
  onEventPointerDown: NonNullable<EventShellProps["onEventPointerDown"]>;
  eventInteractionEnabled: boolean;
  shellClassName?: string;
};
export type CommittedLayerProps<Item extends CommittedItem> = SharedLayerProps & {
  items: Item[];
  interactionMode: "events" | "availability";
  hoveredEvent: { eventId: string; calendarId: CalendarId; dateKey?: string } | null;
  dragEventId?: string;
  appearingEventIds: Set<string>;
  focusedEventTarget?: CalendarFocusedEventTarget | null;
  project: (args: { item: Item; hovered: boolean }) => EventProjection;
};
export type AvailabilityLayerProps<Item extends CommittedItem> = SharedLayerProps & {
  items: Item[];
  interactionMode: "events" | "availability";
  dragEventId?: string;
  appearingEventIds: Set<string>;
  focusedEventTarget?: CalendarFocusedEventTarget | null;
  project: (args: { item: Item }) => EventProjection;
};

export type TransientLayerProps = SharedLayerProps & {
  dateKey: string;
  settings: import("#quno-internal/timeline/core/types").QunoInfiniteCalendarSettings;
  draftEvent: CalendarEvent | null;
  draftEventStatus: EventRenderStatus;
  draftEventIsDraggable: boolean;
  draftEventIsExiting: boolean;
  draftEventReleaseDurationMs?: number;
  dragPreviewEvent: CalendarEvent | null;
  project: (args: {
    event: CalendarEvent;
    preview: boolean;
    segment: import("#quno-internal/timeline/core/types").CalendarEventSegment;
  }) => EventProjection;
};
