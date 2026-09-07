import type { CalendarFocusedEventTarget } from "#quno-internal/timeline/core/internalTypes";
import type { CalendarEvent, CalendarId, EventRenderer } from "#quno-internal/timeline/core/types";
import type { ViewportGeometryRegistration } from "#quno-internal/timeline/infinite/anchors/parent/viewportAnchorTypes";
import type { EventShellProps } from "./EventShell";

export type EventProjection = Pick<EventShellProps, "left" | "top" | "width" | "hoverMaxWidth" | "height">;
export type CommittedItem = Pick<EventShellProps, "event" | "lane" | "laneCount" | "isOverlapping">;
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
  hoveredEvent: { eventId: string; calendarId: CalendarId } | null;
  dragEventId?: string;
  appearingEventIds: Set<string>;
  focusedEventTarget?: CalendarFocusedEventTarget | null;
  project: (args: { item: Item; hovered: boolean }) => EventProjection;
};
export type AvailabilityLayerProps = SharedLayerProps & {
  events: CalendarEvent[];
  interactionMode: "events" | "availability";
  dragEventId?: string;
  appearingEventIds: Set<string>;
  focusedEventTarget?: CalendarFocusedEventTarget | null;
  project: (event: CalendarEvent) => EventProjection;
};
