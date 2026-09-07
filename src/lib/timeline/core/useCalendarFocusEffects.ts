import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { CalendarEvent, CalendarId, QunoInfiniteCalendarProps, CalendarViewportAnchor } from "./types";
import type { CalendarFocusRequest, CalendarFocusResult, CalendarFocusRequestResult } from "./calendarFocusTypes";
import type { CalendarFocusedEventTarget, CalendarViewHandle } from "./internalTypes";
import type { IsoDate } from "#quno-internal/shared/dateRangeModel";

const FOCUS_VISIBILITY_TIMEOUT_MS = 3_000;
const FOCUS_HIGHLIGHT_DURATION_MS = 3_000;
const MANUAL_SCROLL_KEYS = new Set([
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "End",
  "Home",
  "PageDown",
  "PageUp",
  " "
]);

export type PendingFocus = {
  event: CalendarEvent;
  targetCalendarId: CalendarId;
  desiredCalendarIds: CalendarId[];
  anchor: CalendarViewportAnchor | null;
  resolve: (result: CalendarFocusResult) => void;
};

export function eventDateAndTime(event: CalendarEvent) {
  return {
    dateKey: event.start.slice(0, 10) as IsoDate,
    time: event.start.slice(11, 16)
  };
}

type FocusEffectsArgs = Pick<
  QunoInfiniteCalendarProps,
  "selectedCalendarIds" | "focusRequest" | "onFocusRequestComplete"
> & {
  pendingFocus: PendingFocus | null;
  pendingRef: MutableRefObject<PendingFocus | null>;
  focusedEventTarget: CalendarFocusedEventTarget | null;
  highlightTimerRef: MutableRefObject<number | null>;
  lastDeclarativeRequestIdRef: MutableRefObject<CalendarFocusRequest["requestId"] | null>;
  viewRef: MutableRefObject<CalendarViewHandle | null>;
  setFocusedEventTarget: Dispatch<SetStateAction<CalendarFocusedEventTarget | null>>;
  focusEvent: (args: { event: CalendarEvent } & { preferredCalendarId?: CalendarId }) => Promise<CalendarFocusResult>;
  finishPending: (result: CalendarFocusResult) => void;
  cancelActiveFocus: () => void;
};

/** Settles pending focus work and owns transient cancellation/highlight effects. */
export function useCalendarFocusEffects({
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
}: FocusEffectsArgs) {
  useEffect(() => {
    if (!pendingFocus) return;
    const selectionReady = pendingFocus.desiredCalendarIds.every((calendarId) =>
      selectedCalendarIds.includes(calendarId)
    );
    if (!selectionReady) return;

    const { dateKey, time } = eventDateAndTime(pendingFocus.event);
    const target = {
      eventId: pendingFocus.event.id,
      calendarId: pendingFocus.targetCalendarId,
      dateKey,
      time
    };
    setFocusedEventTarget({ eventId: pendingFocus.event.id, calendarId: pendingFocus.targetCalendarId });
    if (!viewRef.current?.isEventFullyVisible(target)) {
      if (pendingFocus.anchor) {
        viewRef.current?.restoreViewportAnchor({
          anchor: pendingFocus.anchor,
          ...{
            target,
            afterRecenter: true,
            cancelOnManualScroll: true
          }
        });
      } else {
        viewRef.current?.scrollToDateTime({ date: dateKey, time });
      }
    }
    finishPending({
      eventId: pendingFocus.event.id,
      renderedCalendarId: pendingFocus.targetCalendarId,
      status: "focused"
    });
    highlightTimerRef.current = window.setTimeout(() => {
      highlightTimerRef.current = null;
      setFocusedEventTarget(null);
    }, FOCUS_HIGHLIGHT_DURATION_MS);
  }, [finishPending, highlightTimerRef, pendingFocus, selectedCalendarIds, setFocusedEventTarget, viewRef]);

  useEffect(() => {
    if (!pendingFocus) return;
    const timeout = window.setTimeout(() => {
      finishPending({
        eventId: pendingFocus.event.id,
        renderedCalendarId: pendingFocus.targetCalendarId,
        status: "unavailable"
      });
    }, FOCUS_VISIBILITY_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [finishPending, pendingFocus]);

  useEffect(() => {
    if (!focusRequest || lastDeclarativeRequestIdRef.current === focusRequest.requestId) return;
    lastDeclarativeRequestIdRef.current = focusRequest.requestId;
    void focusEvent({ event: focusRequest.event, ...{ preferredCalendarId: focusRequest.preferredCalendarId } }).then(
      (result) => {
        const requestResult: CalendarFocusRequestResult = { ...result, requestId: focusRequest.requestId };
        onFocusRequestComplete?.(requestResult);
      }
    );
  }, [focusEvent, focusRequest, lastDeclarativeRequestIdRef, onFocusRequestComplete]);

  useEffect(() => {
    if (!pendingFocus && !focusedEventTarget) return;
    const handleKey = (event: KeyboardEvent) => {
      if (MANUAL_SCROLL_KEYS.has(event.key)) cancelActiveFocus();
    };
    window.addEventListener("pointerdown", cancelActiveFocus, true);
    window.addEventListener("wheel", cancelActiveFocus, true);
    window.addEventListener("touchmove", cancelActiveFocus, true);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("pointerdown", cancelActiveFocus, true);
      window.removeEventListener("wheel", cancelActiveFocus, true);
      window.removeEventListener("touchmove", cancelActiveFocus, true);
      window.removeEventListener("keydown", handleKey);
    };
  }, [cancelActiveFocus, focusedEventTarget, pendingFocus]);

  useEffect(
    () => () => {
      if (highlightTimerRef.current !== null) window.clearTimeout(highlightTimerRef.current);
      const pending = pendingRef.current;
      pending?.resolve({
        eventId: pending.event.id,
        renderedCalendarId: pending.targetCalendarId,
        status: "cancelled"
      });
    },
    [highlightTimerRef, pendingRef]
  );
}
