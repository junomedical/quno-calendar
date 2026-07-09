import { useCallback, useMemo, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { flushSync } from "react-dom";
import {
  type ActiveEventDraft,
  type CalendarEvent,
  type CalendarId,
  type CalendarNavigationHandle,
  type CalendarViewportAnchor,
  type CalendarViewportAnchorTarget,
  type EventActivateRequest,
  type EventCreateRequest,
  type EventMoveRequest
} from "../lib";
import { demoCalendars } from "./data";
import {
  addMinutesToIso,
  dateTimeToIso,
  draftParticipantIds,
  eventParticipantIds,
  isoDateInputValue,
  isoTimeInputValue
} from "./draftFormUtils";
import { buildExternalCreateDraft, calendarColor } from "./externalDraftEvents";

type UseExternalEventDraftsArgs = {
  selectedCalendarIds: CalendarId[];
  calendarRef: RefObject<CalendarNavigationHandle | null>;
  jumpDate: string;
  jumpTime: string;
  snapMinutes: number;
  editAvailabilities: boolean;
  setEvents: Dispatch<SetStateAction<CalendarEvent[]>>;
  setMessage: (message: string) => void;
  onSavedEventCommit?: (event: CalendarEvent) => void;
};

const demoPersonCalendarIds = new Set(demoCalendars.slice(0, 3).map((calendar) => calendar.id));

function firstPersonParticipantId(participantIds: CalendarId[]) {
  return participantIds.find((calendarId) => demoPersonCalendarIds.has(calendarId)) ?? participantIds[0];
}

function eventViewportTarget(
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

function slotViewportTarget(event: CalendarEvent, calendarId?: CalendarId): CalendarViewportAnchorTarget {
  return {
    calendarId: calendarId ?? event.calendarId,
    dateKey: isoDateInputValue(event.start),
    time: isoTimeInputValue(event.start)
  };
}

export function useExternalEventDrafts({
  selectedCalendarIds,
  calendarRef,
  jumpDate,
  jumpTime,
  snapMinutes,
  editAvailabilities,
  setEvents,
  setMessage,
  onSavedEventCommit
}: UseExternalEventDraftsArgs) {
  const [activeDraft, setActiveDraft] = useState<ActiveEventDraft | null>(null);
  const [draftParticipantsChanged, setDraftParticipantsChanged] = useState(false);
  const draftSequenceRef = useRef(0);
  const activeDraftLastSeenAnchorRef = useRef<CalendarViewportAnchor | null>(null);
  const activeEditSourceEventRef = useRef<CalendarEvent | null>(null);

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
    return activeDraftParticipants;
  }, [activeDraft, activeDraftParticipants, draftParticipantsChanged, selectedCalendarIds]);
  const canSaveActiveDraft = !activeDraft || activeDraftParticipants.length > 0;

  const clearActiveDraft = useCallback(() => {
    setActiveDraft(null);
    setDraftParticipantsChanged(false);
    activeDraftLastSeenAnchorRef.current = null;
    activeEditSourceEventRef.current = null;
  }, []);

  const captureEventAnchor = useCallback(
    (event: CalendarEvent, calendarId?: CalendarId, requireVisible = false) =>
      calendarRef.current?.captureViewportAnchor(eventViewportTarget(event, calendarId, event.id, requireVisible)) ??
      null,
    [calendarRef]
  );

  const restoreEventAnchor = useCallback(
    (
      anchor: CalendarViewportAnchor | null,
      event: CalendarEvent,
      {
        eventId = event.id,
        targetCalendarId,
        afterRecenter = true,
        allowNavigationFallback,
        cancelOnManualScroll
      }: {
        eventId?: string;
        targetCalendarId?: CalendarId;
        afterRecenter?: boolean;
        allowNavigationFallback?: boolean;
        cancelOnManualScroll?: boolean;
      } = {}
    ) => {
      calendarRef.current?.restoreViewportAnchor(anchor, {
        target: eventViewportTarget(event, targetCalendarId, eventId),
        afterRecenter,
        allowNavigationFallback,
        cancelOnManualScroll
      });
    },
    [calendarRef]
  );

  const restoreSlotAnchor = useCallback(
    (
      anchor: CalendarViewportAnchor | null,
      event: CalendarEvent,
      {
        targetCalendarId,
        afterRecenter = true,
        allowNavigationFallback,
        cancelOnManualScroll
      }: {
        targetCalendarId?: CalendarId;
        afterRecenter?: boolean;
        allowNavigationFallback?: boolean;
        cancelOnManualScroll?: boolean;
      } = {}
    ) => {
      calendarRef.current?.restoreViewportAnchor(anchor, {
        target: slotViewportTarget(event, targetCalendarId),
        afterRecenter,
        allowNavigationFallback,
        cancelOnManualScroll
      });
    },
    [calendarRef]
  );

  const openCreateDraft = useCallback(
    (request: EventCreateRequest, source: "draw" | "button" = "draw") => {
      draftSequenceRef.current += 1;
      const draftId = `external-draft-${draftSequenceRef.current}`;
      const nextEvent = buildExternalCreateDraft(request, draftId, source);
      const drawnDraftAnchor =
        source === "draw"
          ? calendarRef.current?.captureViewportAnchor(slotViewportTarget(nextEvent, request.calendarId))
          : null;
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
        setDraftParticipantsChanged(false);
        setActiveDraft({ mode: "create", event: nextEvent });
      }
      setMessage(source === "button" ? "External create popup opened" : "Drawn range delegated to external popup");
    },
    [calendarRef, restoreEventAnchor, setMessage]
  );

  const handleActivate = useCallback(
    (request: EventActivateRequest) => {
      const draftEvent = {
        ...request.event,
        calendarIds: eventParticipantIds(request.event)
      };
      activeEditSourceEventRef.current = draftEvent;
      activeDraftLastSeenAnchorRef.current = captureEventAnchor(
        draftEvent,
        firstPersonParticipantId(eventParticipantIds(draftEvent)) ?? draftEvent.calendarId
      );
      setDraftParticipantsChanged(false);
      setActiveDraft({
        mode: "edit",
        sourceEventId: request.event.id,
        event: draftEvent
      });
      setMessage(`Editing ${request.event.title} in external popup`);
    },
    [captureEventAnchor, setMessage]
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

  const focusDraftEvent = useCallback(
    (event: CalendarEvent, anchor: CalendarViewportAnchor | null) => {
      const targetAnchor = anchor ?? activeDraftLastSeenAnchorRef.current;
      if (!targetAnchor) {
        calendarRef.current?.scrollToDateTime(isoDateInputValue(event.start), isoTimeInputValue(event.start));
        return;
      }
      restoreEventAnchor(targetAnchor, event, { afterRecenter: true });
    },
    [calendarRef, restoreEventAnchor]
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
      const dateChanged = nextEvent.start.slice(0, 10) !== activeDraft.event.start.slice(0, 10);
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
    [activeDraft, calendarRef, captureEventAnchor, focusDraftEvent, restoreEventAnchor]
  );

  const updateDraftParticipants = useCallback(
    (updater: (event: CalendarEvent) => CalendarEvent) => {
      if (!activeDraft) {
        return;
      }
      const sourceParticipantIds = activeEditSourceEventRef.current
        ? eventParticipantIds(activeEditSourceEventRef.current)
        : [];
      const sourcePrimaryCalendarId =
        activeDraft.mode === "edit" ? firstPersonParticipantId(sourceParticipantIds) : undefined;
      const anchor =
        (sourcePrimaryCalendarId ? captureEventAnchor(activeDraft.event, sourcePrimaryCalendarId, true) : null) ??
        captureEventAnchor(activeDraft.event, undefined, true) ??
        activeDraftLastSeenAnchorRef.current;
      const nextEvent = updater(activeDraft.event);
      if (anchor) {
        activeDraftLastSeenAnchorRef.current = anchor;
        flushSync(() => {
          setDraftParticipantsChanged(true);
          setActiveDraft({ ...activeDraft, event: nextEvent });
        });
        restoreEventAnchor(anchor, nextEvent, {
          afterRecenter: true,
          allowNavigationFallback: false
        });
        return;
      }
      setDraftParticipantsChanged(true);
      setActiveDraft({ ...activeDraft, event: nextEvent });
    },
    [activeDraft, captureEventAnchor, restoreEventAnchor]
  );

  const handleExternalAdd = useCallback(() => {
    const start = dateTimeToIso(jumpDate, jumpTime);
    const end = addMinutesToIso(start, snapMinutes * 3);
    openCreateDraft(
      {
        start,
        end,
        calendarId: selectedCalendarIds[0] ?? demoCalendars[0].id,
        kind: editAvailabilities ? "availability" : "draft"
      },
      "button"
    );
    calendarRef.current?.scrollToDateTime(jumpDate, jumpTime);
  }, [calendarRef, editAvailabilities, jumpDate, jumpTime, openCreateDraft, selectedCalendarIds, snapMinutes]);

  const saveActiveDraft = useCallback(() => {
    if (!activeDraft) {
      return;
    }
    const participantIds = draftParticipantIds(activeDraft.event);
    if (participantIds.length === 0) {
      setMessage("Select at least one participant before saving");
      return;
    }
    const firstCalendarId = participantIds[0];
    const savedKind: CalendarEvent["kind"] =
      activeDraft.event.kind === "availability"
        ? "availability"
        : activeDraft.event.kind === "blocked"
          ? "blocked"
          : "appointment";
    const savedEvent: CalendarEvent = {
      ...activeDraft.event,
      id: activeDraft.mode === "edit" ? (activeDraft.sourceEventId ?? activeDraft.event.id) : `created-${Date.now()}`,
      calendarId: firstCalendarId,
      calendarIds: participantIds.length > 0 ? participantIds : [firstCalendarId],
      kind: savedKind
    };
    const anchor = captureEventAnchor(activeDraft.event);
    calendarRef.current?.releaseActiveDraft({ animation: "fade-out", durationMs: 420 });
    onSavedEventCommit?.(savedEvent);

    flushSync(() => {
      if (activeDraft.mode === "edit") {
        const sourceEventId = activeDraft.sourceEventId ?? activeDraft.event.id;
        setEvents((current) => current.map((event) => (event.id === sourceEventId ? savedEvent : event)));
        setMessage("Saved external edit");
      } else {
        setEvents((current) => [...current, savedEvent]);
        setMessage("Saved external create");
      }
      clearActiveDraft();
    });
    if (anchor) {
      restoreEventAnchor(anchor, savedEvent, {
        eventId: savedEvent.id,
        afterRecenter: false,
        cancelOnManualScroll: true
      });
    }
  }, [
    activeDraft,
    calendarRef,
    captureEventAnchor,
    clearActiveDraft,
    onSavedEventCommit,
    restoreEventAnchor,
    setEvents,
    setMessage
  ]);

  const cancelActiveDraft = useCallback(() => {
    const sourceParticipantIds = activeEditSourceEventRef.current
      ? eventParticipantIds(activeEditSourceEventRef.current)
      : [];
    const sourcePrimaryCalendarId =
      firstPersonParticipantId(sourceParticipantIds) ??
      activeEditSourceEventRef.current?.calendarId ??
      activeDraft?.event.calendarId;
    const anchor = activeDraft
      ? ((sourcePrimaryCalendarId ? captureEventAnchor(activeDraft.event, sourcePrimaryCalendarId, true) : null) ??
        (activeDraft.mode === "edit" ? activeDraftLastSeenAnchorRef.current : null) ??
        captureEventAnchor(activeDraft.event, undefined, true) ??
        activeDraftLastSeenAnchorRef.current)
      : null;
    const cancelledEvent =
      activeDraft?.mode === "edit" && activeEditSourceEventRef.current && sourcePrimaryCalendarId
        ? {
            ...activeEditSourceEventRef.current,
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
    if (anchor && cancelledEvent) {
      if (activeDraft?.mode === "edit") {
        restoreEventAnchor(anchor, cancelledEvent, {
          eventId: sourceEventId,
          targetCalendarId: sourcePrimaryCalendarId,
          afterRecenter: true,
          allowNavigationFallback: false,
          cancelOnManualScroll: true
        });
        return;
      }
      restoreSlotAnchor(anchor, cancelledEvent, {
        targetCalendarId: sourcePrimaryCalendarId,
        afterRecenter: true,
        cancelOnManualScroll: true
      });
    }
  }, [
    activeDraft,
    calendarRef,
    captureEventAnchor,
    clearActiveDraft,
    restoreEventAnchor,
    restoreSlotAnchor,
    setMessage
  ]);

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
    handleExternalAdd,
    saveActiveDraft,
    cancelActiveDraft,
    updateDraftEvent,
    toggleDraftParticipant
  };
}
