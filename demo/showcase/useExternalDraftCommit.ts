import { useCallback, type Dispatch, type RefObject, type SetStateAction } from "react";
import { flushSync } from "react-dom";
import type {
  ActiveEventDraft,
  CalendarEvent,
  CalendarId,
  QunoInfiniteCalendarHandle,
  CalendarViewportAnchor
} from "@quno/calendar/infinite-calendar";
import { draftParticipantIds, eventParticipantIds } from "./draftFormUtils";
import { firstPersonParticipantId } from "./externalDraftParticipants";
import type { DraftRestoreEventOptions, DraftRestoreOptions } from "./useExternalDraftNavigation";

type CaptureEventAnchor = (
  event: CalendarEvent,
  calendarId?: CalendarId,
  requireVisible?: boolean
) => CalendarViewportAnchor | null;

type RestoreEventAnchor = (
  anchor: CalendarViewportAnchor | null,
  event: CalendarEvent,
  options?: DraftRestoreEventOptions
) => void;

type RestoreSlotAnchor = (
  anchor: CalendarViewportAnchor | null,
  event: CalendarEvent,
  options?: DraftRestoreOptions
) => void;

type ExternalDraftCommitArgs = {
  activeDraft: ActiveEventDraft | null;
  activeEditSourceEventRef: RefObject<CalendarEvent | null>;
  lastSeenAnchorRef: RefObject<CalendarViewportAnchor | null>;
  calendarRef: RefObject<QunoInfiniteCalendarHandle | null>;
  captureEventAnchor: CaptureEventAnchor;
  restoreEventAnchor: RestoreEventAnchor;
  restoreSlotAnchor: RestoreSlotAnchor;
  clearActiveDraft: () => void;
  setEvents: Dispatch<SetStateAction<CalendarEvent[]>>;
  setMessage: (message: string) => void;
};

export function useExternalDraftCommit({
  activeDraft,
  activeEditSourceEventRef,
  lastSeenAnchorRef,
  calendarRef,
  captureEventAnchor,
  restoreEventAnchor,
  restoreSlotAnchor,
  clearActiveDraft,
  setEvents,
  setMessage
}: ExternalDraftCommitArgs) {
  const saveActiveDraft = useCallback(() => {
    if (!activeDraft) return;
    const participantIds = draftParticipantIds(activeDraft.event);
    if (participantIds.length === 0) {
      setMessage("Select at least one participant before saving");
      return;
    }
    const previousEventId =
      activeDraft.mode === "edit" ? (activeDraft.sourceEventId ?? activeDraft.event.id) : undefined;
    const savedEvent: CalendarEvent = {
      ...activeDraft.event,
      id: previousEventId ?? `created-${Date.now()}`,
      calendarId: participantIds[0],
      calendarIds: participantIds,
      kind:
        activeDraft.event.kind === "availability"
          ? "availability"
          : activeDraft.event.kind === "blocked"
            ? "blocked"
            : "appointment"
    };
    const anchor = captureEventAnchor(activeDraft.event);

    flushSync(() => {
      if (activeDraft.mode === "edit") {
        setEvents((current) => current.map((event) => (event.id === previousEventId ? savedEvent : event)));
        setMessage("Saved external edit");
      } else {
        setEvents((current) => [...current, savedEvent]);
        setMessage("Saved external create");
      }
      calendarRef.current?.commitVisibleEvent({ event: savedEvent, ...{ previousEventId, appearing: true } });
      clearActiveDraft();
    });
    if (anchor) {
      restoreEventAnchor(anchor, savedEvent, {
        eventId: savedEvent.id,
        afterRecenter: false,
        cancelOnManualScroll: true
      });
    }
  }, [activeDraft, calendarRef, captureEventAnchor, clearActiveDraft, restoreEventAnchor, setEvents, setMessage]);

  const cancelActiveDraft = useCallback(() => {
    const sourceEvent = activeEditSourceEventRef.current;
    const sourceParticipantIds = sourceEvent ? eventParticipantIds(sourceEvent) : [];
    const sourcePrimaryCalendarId =
      firstPersonParticipantId(sourceParticipantIds) ?? sourceEvent?.calendarId ?? activeDraft?.event.calendarId;
    const anchor = activeDraft
      ? ((sourcePrimaryCalendarId ? captureEventAnchor(activeDraft.event, sourcePrimaryCalendarId, true) : null) ??
        (activeDraft.mode === "edit" ? lastSeenAnchorRef.current : null) ??
        captureEventAnchor(activeDraft.event, undefined, true) ??
        lastSeenAnchorRef.current)
      : null;
    const cancelledEvent =
      activeDraft?.mode === "edit" && sourceEvent && sourcePrimaryCalendarId
        ? {
            ...sourceEvent,
            calendarId: sourcePrimaryCalendarId,
            calendarIds: sourceParticipantIds.length > 0 ? sourceParticipantIds : [sourcePrimaryCalendarId]
          }
        : (activeDraft?.event ?? null);
    const sourceEventId =
      activeDraft?.mode === "edit" ? (activeDraft.sourceEventId ?? activeDraft.event.id) : undefined;

    calendarRef.current?.releaseActiveDraft({ animation: "fade-out" });
    flushSync(() => {
      clearActiveDraft();
      setMessage("External popup cancelled");
    });
    if (!anchor || !cancelledEvent) {
      setMessage("Scroll reset skipped: no captured popup anchor");
      return;
    }
    if (activeDraft?.mode === "edit") {
      restoreEventAnchor(anchor, cancelledEvent, {
        eventId: sourceEventId,
        targetCalendarId: sourcePrimaryCalendarId,
        afterRecenter: true,
        allowNavigationFallback: false,
        cancelOnManualScroll: true
      });
      setMessage("Scroll reset requested for original event");
      return;
    }
    restoreSlotAnchor(anchor, cancelledEvent, {
      targetCalendarId: sourcePrimaryCalendarId,
      afterRecenter: true,
      cancelOnManualScroll: true
    });
    setMessage("Scroll reset requested for drawn slot");
  }, [
    activeDraft,
    activeEditSourceEventRef,
    calendarRef,
    captureEventAnchor,
    clearActiveDraft,
    lastSeenAnchorRef,
    restoreEventAnchor,
    restoreSlotAnchor,
    setMessage
  ]);

  return { saveActiveDraft, cancelActiveDraft };
}
