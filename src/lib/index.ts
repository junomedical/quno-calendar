/**
 * Domain: Foundation.
 * Responsibility: Defines the supported package exports and public compatibility boundary.
 * Preserves: the public compatibility boundary and deterministic cross-domain primitives.
 * Does not own: runtime feature coordination.
 * Failure/cancellation: invalid inputs are normalized or rejected by the documented public contract.
 *
 * @see docs/domains/foundation.md#source-map
 */
export { CalendarRoot } from "./core/CalendarRoot";
export { defaultEventPrefetchPolicy } from "./data/eventPrefetch";
export {
  applyEventMove,
  eventBelongsToCalendar,
  eventCalendarIds,
  replaceEventCalendarMembership
} from "./data/calendarEvents";
export {
  defaultTimelineSettings,
  type ActiveDraftReleaseOptions,
  type ActiveEventDraft,
  type CalendarEvent,
  type CalendarId,
  type CalendarNavigationHandle,
  type CalendarRootProps,
  type CalendarRow,
  type CalendarVisibleEventCommitOptions,
  type CalendarViewportAnchor,
  type CalendarViewportAnchorRestoreOptions,
  type CalendarViewportAnchorTarget,
  type CalendarViewComponentProps,
  type EventActivateRequest,
  type EventCreateRequest,
  type EventId,
  type EventMoveRequest,
  type EventPrefetchContext,
  type EventPrefetchPolicy,
  type EventPrefetchWindow,
  type EventRenderer,
  type EventRendererProps,
  type EventRenderStatus,
  type LoadEvents,
  type LoadEventsArgs,
  type TimelineSettings
} from "./core/types";
