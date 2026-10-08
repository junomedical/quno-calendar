import { useCallback, useRef, type RefObject } from "react";
import type {
  CalendarEvent,
  CalendarId,
  QunoInfiniteCalendarHandle,
  CalendarViewportAnchor,
  CalendarViewportAnchorTarget,
  CalendarView
} from "@quno/calendar/infinite-calendar";
import { isoDateInputValue, isoTimeInputValue } from "./draftFormUtils";

export type DraftRestoreOptions = {
  targetCalendarId?: CalendarId;
  afterRecenter?: boolean;
  allowNavigationFallback?: boolean;
  cancelOnManualScroll?: boolean;
};

export type DraftRestoreEventOptions = DraftRestoreOptions & {
  eventId?: string;
};

function eventTarget(
  event: CalendarEvent,
  calendarId?: CalendarId,
  eventId = event.id,
  requireVisible = false
): CalendarViewportAnchorTarget {
  return {
    eventId,
    calendarId,
    dateKey: isoDateInputValue(event.start),
    time: isoTimeInputValue(event.start),
    requireVisible
  };
}

function slotTarget(event: CalendarEvent, calendarId?: CalendarId): CalendarViewportAnchorTarget {
  return {
    calendarId: calendarId ?? event.calendarId,
    dateKey: isoDateInputValue(event.start),
    time: isoTimeInputValue(event.start)
  };
}

export function useExternalDraftNavigation(
  calendarRef: RefObject<QunoInfiniteCalendarHandle | null>,
  view: CalendarView
) {
  const lastSeenAnchorRef = useRef<CalendarViewportAnchor | null>(null);

  const captureEventAnchor = useCallback(
    (event: CalendarEvent, calendarId?: CalendarId, requireVisible = false) =>
      calendarRef.current?.captureViewportAnchor(eventTarget(event, calendarId, event.id, requireVisible)) ?? null,
    [calendarRef]
  );

  const captureSlotAnchor = useCallback(
    (event: CalendarEvent, calendarId?: CalendarId) =>
      calendarRef.current?.captureViewportAnchor(slotTarget(event, calendarId)) ?? null,
    [calendarRef]
  );

  const restoreEventAnchor = useCallback(
    (anchor: CalendarViewportAnchor | null, event: CalendarEvent, options: DraftRestoreEventOptions = {}) => {
      calendarRef.current?.restoreViewportAnchor({
        anchor,
        ...{
          target: eventTarget(
            event,
            options.targetCalendarId ?? anchor?.target.calendarId,
            options.eventId ?? event.id
          ),
          afterRecenter: options.afterRecenter ?? true,
          allowNavigationFallback: options.allowNavigationFallback,
          cancelOnManualScroll: options.cancelOnManualScroll
        }
      });
    },
    [calendarRef]
  );

  const restoreSlotAnchor = useCallback(
    (anchor: CalendarViewportAnchor | null, event: CalendarEvent, options: DraftRestoreOptions = {}) => {
      calendarRef.current?.restoreViewportAnchor({
        anchor,
        ...{
          target: slotTarget(event, options.targetCalendarId ?? anchor?.target.calendarId),
          afterRecenter: options.afterRecenter ?? true,
          allowNavigationFallback: options.allowNavigationFallback,
          cancelOnManualScroll: options.cancelOnManualScroll
        }
      });
    },
    [calendarRef]
  );

  // Horizontal edit chrome fills the row; anchoring its compact lane would move
  // the grid on open and make a closing restore chase hover expansion.
  const captureEditorAnchor = useCallback(
    (event: CalendarEvent, calendarId?: CalendarId, requireVisible = false) => {
      const anchor = captureEventAnchor(event, calendarId, requireVisible);
      return anchor && view === "infinite-horizontal" ? captureSlotAnchor(event, anchor.target.calendarId) : anchor;
    },
    [captureEventAnchor, captureSlotAnchor, view]
  );
  const restoreEditorAnchor = view === "infinite-horizontal" ? restoreSlotAnchor : restoreEventAnchor;

  const focusDraftEvent = useCallback(
    (event: CalendarEvent, anchor: CalendarViewportAnchor | null) => {
      const targetAnchor = anchor ?? lastSeenAnchorRef.current;
      if (targetAnchor) {
        restoreEventAnchor(targetAnchor, event, { afterRecenter: true });
        return;
      }
      calendarRef.current?.scrollToDateTime({
        date: isoDateInputValue(event.start),
        time: isoTimeInputValue(event.start)
      });
    },
    [calendarRef, restoreEventAnchor]
  );

  return {
    lastSeenAnchorRef,
    captureEventAnchor,
    captureSlotAnchor,
    captureEditorAnchor,
    restoreEditorAnchor,
    restoreEventAnchor,
    restoreSlotAnchor,
    focusDraftEvent
  };
}
