/**
 * Domain: Anchors.
 * Responsibility: Defines internal geometry registration and restore-target contracts.
 * Preserves: the current semantic calendar location across geometry changes.
 * Does not own: browser DOM focus and gesture recognition.
 * Failure/cancellation: unresolved targets retry, fall back, or yield according to anchor priority.
 *
 * @see docs/domains/anchors.md#source-map
 */
import type { CalendarId, EventId } from "../../../core/types";

export type ViewportGeometryRegistration = {
  registerDayElement: (dateKey: string, element: HTMLElement | null) => void;
  registerResourceElement: (dateKey: string, calendarId: CalendarId, element: HTMLElement | null) => void;
  registerEventElement: (
    eventId: EventId,
    calendarId: CalendarId,
    element: HTMLElement | null,
    previousElement?: HTMLElement | null
  ) => void;
};
