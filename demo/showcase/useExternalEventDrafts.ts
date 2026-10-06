import { useCallback, useMemo, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { flushSync } from "react-dom";
import {
  type ActiveEventDraft,
  type CalendarEvent,
  type CalendarId,
  type QunoInfiniteCalendarHandle,
  type EventActivateRequest,
  type EventCreateRequest,
  type EventMoveRequest,
  type CalendarViewportAnchor
} from "@quno/calendar/infinite-calendar";
import { demoCalendars } from "./data";
import { draftParticipantIds, eventParticipantIds, isoDateInputValue } from "./draftFormUtils";
import { buildExternalCreateDraft, calendarColor } from "./externalDraftEvents";
import { firstPersonParticipantId } from "./externalDraftParticipants";
import { captureParticipantAnchor } from "./externalDraftParticipantAnchor";
import { useExternalDraftCommit } from "./useExternalDraftCommit";
import { useExternalDraftNavigation } from "./useExternalDraftNavigation";

type UseExternalEventDraftsArgs = {
  selectedCalendarIds: CalendarId[];
  calendarRef: RefObject<QunoInfiniteCalendarHandle | null>;
  setEvents: Dispatch<SetStateAction<CalendarEvent[]>>;
  setMessage: (message: string) => void;
};

export function useExternalEventDrafts({
  selectedCalendarIds,
  calendarRef,
  setEvents,
  setMessage
}: UseExternalEventDraftsArgs) {
  const [activeDraft, setActiveDraft] = useState<ActiveEventDraft | null>(null);
  const [draftParticipantsChanged, setDraftParticipantsChanged] = useState(false);
  const draftSequenceRef = useRef(0);
  const activeEditSourceEventRef = useRef<CalendarEvent | null>(null);
  const activeEditSourceAnchorRef = useRef<CalendarViewportAnchor | null>(null);
  const {
    lastSeenAnchorRef: activeDraftLastSeenAnchorRef,
    captureEventAnchor,
    captureSlotAnchor,
    restoreEventAnchor,
    restoreSlotAnchor,
    focusDraftEvent
  } = useExternalDraftNavigation(calendarRef);

  const activeDraftParticipants = useMemo(
    () => (activeDraft ? draftParticipantIds(activeDraft.event) : []),
    [activeDraft]
  );
  const visibleCalendarIds = useMemo(() => {
    if (!activeDraft) {
      return selectedCalendarIds;
    }
    const shouldFilterCalendars = activeDraft.mode === "create" || draftParticipantsChanged;
    if (!shouldFilterCalendars) {
      return selectedCalendarIds;
    }
    return activeDraftParticipants.length > 0 ? activeDraftParticipants : selectedCalendarIds;
  }, [activeDraft, activeDraftParticipants, draftParticipantsChanged, selectedCalendarIds]);
  const canSaveActiveDraft = !activeDraft || activeDraftParticipants.length > 0;

  const clearActiveDraft = useCallback(() => {
    setActiveDraft(null);
    setDraftParticipantsChanged(false);
    activeDraftLastSeenAnchorRef.current = null;
    activeEditSourceEventRef.current = null;
    activeEditSourceAnchorRef.current = null;
  }, [activeDraftLastSeenAnchorRef]);

  const openCreateDraft = useCallback(
    (request: EventCreateRequest, source: "draw" | "button" = "draw") => {
      draftSequenceRef.current += 1;
      const draftId = `external-draft-${draftSequenceRef.current}`;
      const nextEvent = buildExternalCreateDraft(request, draftId, source);
      const drawnDraftAnchor = source === "draw" ? captureSlotAnchor(nextEvent, request.calendarId) : null;
      if (drawnDraftAnchor) {
        activeEditSourceEventRef.current = null;
        activeDraftLastSeenAnchorRef.current = drawnDraftAnchor;
        flushSync(() => {
          setDraftParticipantsChanged(false);
          setActiveDraft({ mode: "create", event: nextEvent });
        });
        restoreEventAnchor(drawnDraftAnchor, nextEvent, {
          eventId: draftId,
          afterRecenter: true,
          allowNavigationFallback: false,
          cancelOnManualScroll: true
        });
      } else {
        activeEditSourceEventRef.current = null;
        activeDraftLastSeenAnchorRef.current = null;
        flushSync(() => {
          setDraftParticipantsChanged(false);
          setActiveDraft({ mode: "create", event: nextEvent });
        });
      }
      setMessage(source === "button" ? "External create popup opened" : "Drawn range delegated to external popup");
    },
    [activeDraftLastSeenAnchorRef, captureSlotAnchor, restoreEventAnchor, setMessage]
  );

  const handleActivate = useCallback(
    (request: EventActivateRequest) => {
      const draftEvent = {
        ...request.event,
        calendarIds: eventParticipantIds(request.event)
      };
      activeEditSourceEventRef.current = draftEvent;
      activeEditSourceAnchorRef.current = captureEventAnchor(
        draftEvent,
        firstPersonParticipantId(eventParticipantIds(draftEvent)) ?? draftEvent.calendarId
      );
      const visibleAnchor = captureEventAnchor(draftEvent, request.renderedCalendarId, true);
      activeDraftLastSeenAnchorRef.current = visibleAnchor ?? activeEditSourceAnchorRef.current;
      setDraftParticipantsChanged(false);
      setActiveDraft({
        mode: "edit",
        sourceEventId: request.event.id,
        event: draftEvent
      });
      if (visibleAnchor) {
        restoreEventAnchor(visibleAnchor, draftEvent, {
          afterRecenter: true,
          allowNavigationFallback: false,
          cancelOnManualScroll: true
        });
      }
      setMessage(`Editing ${request.event.title} in external popup`);
    },
    [activeDraftLastSeenAnchorRef, captureEventAnchor, restoreEventAnchor, setMessage]
  );

  const handleActiveDraftMove = useCallback(
    (request: EventMoveRequest) => {
      calendarRef.current?.cancelViewportAnchorRestore();
      setActiveDraft((current) => {
        if (!current || current.event.id !== request.event.id) {
          return current;
        }
        const firstCalendarId = request.proposedCalendarIds[0] ?? request.proposedCalendarId;
        const firstCalendar = demoCalendars.find((calendar) => calendar.id === firstCalendarId);
        return {
          ...current,
          event: {
            ...current.event,
            calendarId: firstCalendarId,
            calendarIds: request.proposedCalendarIds,
            start: request.proposedStart,
            end: request.proposedEnd,
            color: firstCalendar?.color ?? current.event.color
          }
        };
      });
    },
    [calendarRef]
  );

  const updateDraftEvent = useCallback(
    (updater: (event: CalendarEvent) => CalendarEvent) => {
      if (!activeDraft) {
        return;
      }
      const previousLastSeenAnchor = activeDraftLastSeenAnchorRef.current;
      const visibleAnchor = captureEventAnchor(activeDraft.event, undefined, true);
      const nextEvent = updater(activeDraft.event);
      const geometryChanged =
        nextEvent.start !== activeDraft.event.start ||
        nextEvent.end !== activeDraft.event.end ||
        nextEvent.calendarId !== activeDraft.event.calendarId ||
        (nextEvent.calendarIds ?? []).join("|") !== (activeDraft.event.calendarIds ?? []).join("|");
      const dateChanged = isoDateInputValue(nextEvent.start) !== isoDateInputValue(activeDraft.event.start);
      calendarRef.current?.cancelViewportAnchorRestore();
      if (visibleAnchor && dateChanged) {
        activeDraftLastSeenAnchorRef.current = visibleAnchor;
        flushSync(() => {
          setActiveDraft({ ...activeDraft, event: nextEvent });
        });
        const movedVisibleAnchor = captureEventAnchor(nextEvent, undefined, true);
        if (movedVisibleAnchor) {
          activeDraftLastSeenAnchorRef.current = movedVisibleAnchor;
          return;
        }
        restoreEventAnchor(visibleAnchor, nextEvent, {
          afterRecenter: true
        });
        return;
      }
      if (visibleAnchor && geometryChanged) {
        activeDraftLastSeenAnchorRef.current = visibleAnchor;
        setActiveDraft({ ...activeDraft, event: nextEvent });
        restoreEventAnchor(visibleAnchor, nextEvent, {
          afterRecenter: false,
          allowNavigationFallback: false
        });
        return;
      }
      if (visibleAnchor && !geometryChanged) {
        const targetAnchor = previousLastSeenAnchor ?? visibleAnchor;
        activeDraftLastSeenAnchorRef.current = targetAnchor;
        flushSync(() => {
          setActiveDraft({ ...activeDraft, event: nextEvent });
        });
        restoreEventAnchor(targetAnchor, nextEvent, {
          afterRecenter: true
        });
        return;
      }
      flushSync(() => {
        setActiveDraft({ ...activeDraft, event: nextEvent });
      });
      focusDraftEvent(nextEvent, visibleAnchor);
    },
    [activeDraft, activeDraftLastSeenAnchorRef, calendarRef, captureEventAnchor, focusDraftEvent, restoreEventAnchor]
  );

  const updateDraftParticipants = useCallback(
    (updater: (event: CalendarEvent) => CalendarEvent) => {
      if (!activeDraft) {
        return;
      }
      const sourcePrimaryId = activeEditSourceEventRef.current
        ? firstPersonParticipantId(eventParticipantIds(activeEditSourceEventRef.current))
        : undefined;
      const sourceAnchor = sourcePrimaryId ? captureEventAnchor(activeDraft.event, sourcePrimaryId, true) : null;
      if (sourceAnchor) activeEditSourceAnchorRef.current = sourceAnchor;
      const nextEvent = updater(activeDraft.event);
      const anchor = captureParticipantAnchor({
        event: activeDraft.event,
        nextEvent,
        previousAnchor: activeDraftLastSeenAnchorRef.current,
        captureEventAnchor
      });
      calendarRef.current?.cancelViewportAnchorRestore();
      setDraftParticipantsChanged(true);
      setActiveDraft({ ...activeDraft, event: nextEvent });
      if (!anchor) return;
      activeDraftLastSeenAnchorRef.current = anchor;
      const options = {
        targetCalendarId: anchor.target.calendarId,
        afterRecenter: true,
        allowNavigationFallback: false,
        cancelOnManualScroll: true
      };
      if (nextEvent.calendarIds?.length === 0) {
        restoreSlotAnchor(anchor, nextEvent, options);
      } else {
        restoreEventAnchor(anchor, nextEvent, options);
      }
    },
    [activeDraft, activeDraftLastSeenAnchorRef, calendarRef, captureEventAnchor, restoreEventAnchor, restoreSlotAnchor]
  );

  const { saveActiveDraft, cancelActiveDraft } = useExternalDraftCommit({
    activeDraft,
    activeEditSourceEventRef,
    activeEditSourceAnchorRef,
    lastSeenAnchorRef: activeDraftLastSeenAnchorRef,
    calendarRef,
    captureEventAnchor,
    restoreEventAnchor,
    restoreSlotAnchor,
    clearActiveDraft,
    setEvents,
    setMessage
  });

  const toggleDraftParticipant = useCallback(
    (calendarId: CalendarId, checked: boolean) => {
      updateDraftParticipants((event) => {
        const currentIds = draftParticipantIds(event);
        const nextIds = checked
          ? Array.from(new Set([...currentIds, calendarId]))
          : currentIds.filter((candidate) => candidate !== calendarId);
        const firstCalendarId = nextIds[0] ?? event.calendarId;
        return {
          ...event,
          calendarId: firstCalendarId,
          calendarIds: nextIds,
          color: calendarColor(firstCalendarId) ?? event.color
        };
      });
    },
    [updateDraftParticipants]
  );

  return {
    activeDraft,
    visibleCalendarIds,
    canSaveActiveDraft,
    resetActiveDraft: clearActiveDraft,
    openCreateDraft,
    handleActivate,
    handleActiveDraftMove,
    saveActiveDraft,
    cancelActiveDraft,
    updateDraftEvent,
    toggleDraftParticipant
  };
}
