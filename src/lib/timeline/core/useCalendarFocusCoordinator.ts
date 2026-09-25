import { useCallback, useRef, useState, type RefObject } from "react";
import { eventCalendarIds } from "#quno-internal/timeline/data/calendarEvents";
import { fromDateKey, isWeekdayExcluded } from "#quno-internal/timeline/date/dateVirtualization";
import type { CalendarEvent, QunoInfiniteCalendarProps } from "./types";
import type { CalendarFocusOptions, CalendarFocusResult } from "./calendarFocusTypes";
import type { CalendarFocusedEventTarget, CalendarViewHandle } from "./internalTypes";
import { eventDateAndTime, useCalendarFocusEffects, type PendingFocus } from "./useCalendarFocusEffects";

type FocusCoordinatorArgs = Pick<
  QunoInfiniteCalendarProps,
  "calendars" | "selectedCalendarIds" | "focusRequest" | "onCalendarVisibilityRequest" | "onFocusRequestComplete"
> & {
  excludedWeekdays: number[];
  viewRef: RefObject<CalendarViewHandle | null>;
};

export function useCalendarFocusCoordinator({
  calendars,
  selectedCalendarIds,
  excludedWeekdays,
  focusRequest,
  onCalendarVisibilityRequest,
  onFocusRequestComplete,
  viewRef
}: FocusCoordinatorArgs) {
  const [pendingFocus, setPendingFocus] = useState<PendingFocus | null>(null);
  const pendingRef = useRef<PendingFocus | null>(null);
  const [focusedEventTarget, setFocusedEventTarget] = useState<CalendarFocusedEventTarget | null>(null);
  const lastDeclarativeRequestIdRef = useRef<string | number | null>(null);
  const highlightTimerRef = useRef<number | null>(null);

  const finishPending = useCallback((result: CalendarFocusResult) => {
    const pending = pendingRef.current;
    if (!pending) return;
    pendingRef.current = null;
    setPendingFocus(null);
    pending.resolve(result);
  }, []);

  const cancelActiveFocus = useCallback(() => {
    if (pendingRef.current) {
      const pending = pendingRef.current;
      finishPending({
        eventId: pending.event.id,
        renderedCalendarId: pending.targetCalendarId,
        status: "cancelled"
      });
    }
    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }
    setFocusedEventTarget(null);
    viewRef.current?.cancelViewportAnchorRestore();
  }, [finishPending, viewRef]);

  const focusEvent = useCallback(
    ({ event, ...options }: { event: CalendarEvent } & CalendarFocusOptions): Promise<CalendarFocusResult> => {
      cancelActiveFocus();
      const { dateKey, time } = eventDateAndTime(event);
      if (isWeekdayExcluded({ date: fromDateKey({ dateKey }), excludedWeekdays })) {
        return Promise.resolve({ eventId: event.id, status: "unavailable" });
      }
      const knownCalendarIds = new Set(calendars.map((calendar) => calendar.id));
      const participantIds = eventCalendarIds(event).filter((calendarId) => knownCalendarIds.has(calendarId));
      const preferredCalendarId =
        options.preferredCalendarId && participantIds.includes(options.preferredCalendarId)
          ? options.preferredCalendarId
          : participantIds.includes(event.calendarId)
            ? event.calendarId
            : participantIds[0];

      if (!preferredCalendarId || !viewRef.current) {
        return Promise.resolve({ eventId: event.id, status: "unavailable" });
      }

      const desiredSet = new Set(selectedCalendarIds);
      for (const calendar of calendars) {
        if (participantIds.includes(calendar.id)) desiredSet.add(calendar.id);
      }
      const desiredCalendarIds = [...desiredSet];
      const visibleAnchorCalendarId = visibleFocusAnchorCalendarId({
        participantIds,
        selectedCalendarIds,
        preferredCalendarId
      });
      const anchor = visibleAnchorCalendarId
        ? viewRef.current.captureViewportAnchor({
            eventId: event.id,
            calendarId: visibleAnchorCalendarId,
            dateKey,
            time
          })
        : null;

      return new Promise<CalendarFocusResult>((resolve) => {
        const pending = {
          event,
          targetCalendarId: preferredCalendarId,
          desiredCalendarIds,
          anchor,
          resolve
        };
        pendingRef.current = pending;
        setPendingFocus(pending);
        const needsVisibilityUpdate = desiredCalendarIds.some(
          (calendarId) => !selectedCalendarIds.includes(calendarId)
        );
        if (needsVisibilityUpdate) {
          onCalendarVisibilityRequest?.({ calendarIds: desiredCalendarIds, reason: "focus-event" });
        }
      });
    },
    [calendars, cancelActiveFocus, excludedWeekdays, onCalendarVisibilityRequest, selectedCalendarIds, viewRef]
  );

  useCalendarFocusEffects({
    selectedCalendarIds,
    focusRequest,
    onFocusRequestComplete,
    pendingFocus,
    pendingRef,
    focusedEventTarget,
    highlightTimerRef,
    lastDeclarativeRequestIdRef,
    viewRef,
    setFocusedEventTarget,
    focusEvent,
    finishPending,
    cancelActiveFocus
  });

  return { focusEvent, focusedEventTarget };
}

export function visibleFocusAnchorCalendarId({
  participantIds,
  selectedCalendarIds,
  preferredCalendarId
}: {
  participantIds: string[];
  selectedCalendarIds: string[];
  preferredCalendarId?: string;
}) {
  if (
    preferredCalendarId &&
    participantIds.includes(preferredCalendarId) &&
    selectedCalendarIds.includes(preferredCalendarId)
  ) {
    return preferredCalendarId;
  }
  return participantIds.find((calendarId) => selectedCalendarIds.includes(calendarId));
}
