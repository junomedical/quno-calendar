import { useCallback, useMemo, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import { flushSync } from "react-dom";
import {
  type ActiveEventDraft,
  type CalendarEvent,
  type CalendarId,
  type CalendarNavigationHandle,
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
import { findRenderedDraftBox, findVisibleRenderedDraftBox, type DraftScreenSnapshot } from "./draftViewportUtils";
import { buildExternalCreateDraft, calendarColor } from "./externalDraftEvents";
import { useDraftRestoreCancellation } from "./useDraftRestoreCancellation";

type PendingDraftRestore = {
  snapshot: DraftScreenSnapshot;
  event: CalendarEvent;
  eventId?: string;
  targetCalendarId?: CalendarId;
  afterRecenter?: boolean;
  allowNavigationFallback?: boolean;
  cancelOnManualScroll?: boolean;
};

type DraftCalendarSettings = {
  startHour: number;
  endHour: number;
  zoom: number;
  excludedWeekdays: number[];
  dayHeaderHeight: number;
  rowHeight: number;
};

type UseExternalEventDraftsArgs = {
  selectedCalendarIds: CalendarId[];
  calendarSettings: DraftCalendarSettings;
  calendarRef: RefObject<CalendarNavigationHandle | null>;
  jumpDate: string;
  jumpTime: string;
  snapMinutes: number;
  editAvailabilities: boolean;
  setEvents: Dispatch<SetStateAction<CalendarEvent[]>>;
  setMessage: (message: string) => void;
};

const demoPersonCalendarIds = new Set(demoCalendars.slice(0, 3).map((calendar) => calendar.id));

function firstPersonParticipantId(participantIds: CalendarId[]) {
  return participantIds.find((calendarId) => demoPersonCalendarIds.has(calendarId)) ?? participantIds[0];
}

export function useExternalEventDrafts({
  selectedCalendarIds,
  calendarSettings,
  calendarRef,
  jumpDate,
  jumpTime,
  snapMinutes,
  editAvailabilities,
  setEvents,
  setMessage
}: UseExternalEventDraftsArgs) {
  const [activeDraft, setActiveDraft] = useState<ActiveEventDraft | null>(null);
  const [draftParticipantsChanged, setDraftParticipantsChanged] = useState(false);
  const draftSequenceRef = useRef(0);
  const activeDraftLastSeenSnapshotRef = useRef<DraftScreenSnapshot | null>(null);
  const activeEditSourceEventRef = useRef<CalendarEvent | null>(null);
  const restoreTokenRef = useRef(0);
  const restoreManualScrollCleanupRef = useRef<(() => void) | null>(null);
  const expectedProgrammaticScrollRef = useRef<{ top: number; left: number } | null>(null);

  const activeDraftParticipants = activeDraft ? draftParticipantIds(activeDraft.event) : [];
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

  useDraftRestoreCancellation(activeDraft, restoreTokenRef, expectedProgrammaticScrollRef);

  const findEventTargetBox = useCallback(
    (pending: PendingDraftRestore, requireVisible = false): DraftScreenSnapshot | null => {
      const viewport = document.querySelector<HTMLElement>(".ic-viewport");
      if (!viewport) {
        return null;
      }
      const dateKey = isoDateInputValue(pending.event.start);
      const viewportBox = viewport.getBoundingClientRect();
      const dayElement = document.querySelector<HTMLElement>(`[data-testid="calendar-day"][data-date="${dateKey}"]`);
      const matchingEventElements = pending.eventId
        ? Array.from(
            document.querySelectorAll<HTMLElement>(
              '[data-testid="draft-event"], [data-testid="calendar-event"], [data-testid="availability-event"]'
            )
          ).filter((element) => element.dataset.eventId === pending.eventId)
        : [];
      const targetCalendarEventElements = pending.targetCalendarId
        ? matchingEventElements.filter((element) => element.dataset.calendarId === pending.targetCalendarId)
        : [];
      const eventElements =
        targetCalendarEventElements.length > 0 ? targetCalendarEventElements : matchingEventElements;
      const visibleEventElement = eventElements.find((element) => {
        const box = element.getBoundingClientRect();
        return (
          box.width > 0 &&
          box.height > 0 &&
          box.right > viewportBox.left &&
          box.left < viewportBox.right &&
          box.bottom > viewportBox.top &&
          box.top < viewportBox.bottom
        );
      });
      const eventElement =
        visibleEventElement ??
        (pending.targetCalendarId ? (eventElements[0] ?? null) : requireVisible ? null : (eventElements[0] ?? null));
      if (eventElement) {
        const eventBox = eventElement.getBoundingClientRect();
        return {
          top: eventBox.top - viewportBox.top,
          left: eventBox.left - viewportBox.left
        };
      }

      const calendarId = pending.targetCalendarId ?? pending.event.calendarId;
      const horizontalRow = dayElement?.querySelector<HTMLElement>(
        `[data-testid="calendar-row"][data-calendar-id="${calendarId}"]`
      );
      if (horizontalRow) {
        const rowBox = horizontalRow.getBoundingClientRect();
        const minutes = new Date(pending.event.start).getHours() * 60 + new Date(pending.event.start).getMinutes();
        const x = 8 + (minutes - calendarSettings.startHour * 60) * Math.max(0.5, calendarSettings.zoom);
        const gridBox = horizontalRow.querySelector<HTMLElement>(".ic-row-grid")?.getBoundingClientRect();
        return {
          top: rowBox.top - viewportBox.top,
          left: (gridBox?.left ?? rowBox.left) - viewportBox.left + x
        };
      }

      const verticalColumn = dayElement?.querySelector<HTMLElement>(
        `[data-testid="calendar-column"][data-calendar-id="${calendarId}"]`
      );
      if (verticalColumn) {
        const columnBox = verticalColumn.getBoundingClientRect();
        const minutes = new Date(pending.event.start).getHours() * 60 + new Date(pending.event.start).getMinutes();
        const y = 8 + (minutes - calendarSettings.startHour * 60) * Math.max(0.5, calendarSettings.zoom);
        return {
          top: columnBox.top - viewportBox.top + y,
          left: columnBox.left - viewportBox.left
        };
      }

      return null;
    },
    [calendarSettings]
  );

  const restoreDraftScreenPositionNow = useCallback(
    (pending: PendingDraftRestore | null) => {
      if (!pending) {
        return;
      }
      restoreManualScrollCleanupRef.current?.();
      restoreManualScrollCleanupRef.current = null;
      const restoreToken = (restoreTokenRef.current += 1);
      const isCurrentRestore = () => restoreTokenRef.current === restoreToken;
      const restoreViewport = document.querySelector<HTMLElement>(".ic-viewport");
      let removeManualScrollListener: (() => void) | null = null;
      if (restoreViewport && pending.cancelOnManualScroll) {
        let lastObservedScroll = {
          top: restoreViewport.scrollTop,
          left: restoreViewport.scrollLeft
        };
        let hasUserScrollIntent = false;
        const markUserScrollIntent = () => {
          hasUserScrollIntent = true;
        };
        const cancelOnManualScroll = () => {
          const expected = expectedProgrammaticScrollRef.current;
          if (
            expected &&
            Math.abs(restoreViewport.scrollTop - expected.top) <= 1 &&
            Math.abs(restoreViewport.scrollLeft - expected.left) <= 1
          ) {
            expectedProgrammaticScrollRef.current = null;
            lastObservedScroll = {
              top: restoreViewport.scrollTop,
              left: restoreViewport.scrollLeft
            };
            return;
          }
          if (
            Math.abs(restoreViewport.scrollTop - lastObservedScroll.top) <= 1 &&
            Math.abs(restoreViewport.scrollLeft - lastObservedScroll.left) <= 1
          ) {
            return;
          }
          if (!hasUserScrollIntent) {
            lastObservedScroll = {
              top: restoreViewport.scrollTop,
              left: restoreViewport.scrollLeft
            };
            return;
          }
          expectedProgrammaticScrollRef.current = null;
          restoreTokenRef.current += 1;
          removeManualScrollListener?.();
        };
        const markKeyboardScrollIntent = (event: KeyboardEvent) => {
          if (
            ["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp", "End", "Home", "PageDown", "PageUp", " "].includes(
              event.key
            )
          ) {
            markUserScrollIntent();
          }
        };
        removeManualScrollListener = () => {
          restoreViewport.removeEventListener("scroll", cancelOnManualScroll);
          restoreViewport.removeEventListener("pointerdown", markUserScrollIntent);
          window.removeEventListener("wheel", markUserScrollIntent, true);
          window.removeEventListener("touchmove", markUserScrollIntent, true);
          window.removeEventListener("keydown", markKeyboardScrollIntent);
          if (restoreManualScrollCleanupRef.current === removeManualScrollListener) {
            restoreManualScrollCleanupRef.current = null;
          }
        };
        restoreManualScrollCleanupRef.current = removeManualScrollListener;
        restoreViewport.addEventListener("scroll", cancelOnManualScroll, { passive: true });
        restoreViewport.addEventListener("pointerdown", markUserScrollIntent, { passive: true });
        window.addEventListener("wheel", markUserScrollIntent, { passive: true, capture: true });
        window.addEventListener("touchmove", markUserScrollIntent, { passive: true, capture: true });
        window.addEventListener("keydown", markKeyboardScrollIntent);
        window.setTimeout(() => removeManualScrollListener?.(), pending.afterRecenter ? 2800 : 120);
      }
      const applyScrollCorrection = (viewport: HTMLElement, target: DraftScreenSnapshot) => {
        if (!isCurrentRestore()) {
          return;
        }
        const nextTop = viewport.scrollTop + target.top - pending.snapshot.top;
        const nextLeft = viewport.scrollLeft + target.left - pending.snapshot.left;
        expectedProgrammaticScrollRef.current = { top: nextTop, left: nextLeft };
        viewport.scrollTop = nextTop;
        viewport.scrollLeft = nextLeft;
      };
      const fallbackToDateTime = () => {
        if (!isCurrentRestore()) {
          return;
        }
        if (findEventTargetBox(pending, pending.allowNavigationFallback === false)) {
          applyExactCorrection();
          return;
        }
        if (pending.allowNavigationFallback === false) {
          return;
        }
        calendarRef.current?.scrollToDateTime(
          isoDateInputValue(pending.event.start),
          isoTimeInputValue(pending.event.start)
        );
        window.requestAnimationFrame(applyExactCorrection);
      };
      const applyExactCorrection = () => {
        if (!isCurrentRestore()) {
          return;
        }
        const nextViewport = document.querySelector<HTMLElement>(".ic-viewport");
        const nextTarget = findEventTargetBox(pending, pending.allowNavigationFallback === false);
        if (!nextViewport || !nextTarget) {
          return;
        }
        applyScrollCorrection(nextViewport, nextTarget);
      };
      const viewport = document.querySelector<HTMLElement>(".ic-viewport");
      const target = findEventTargetBox(pending, pending.allowNavigationFallback === false);
      if (!viewport || !target) {
        window.requestAnimationFrame(applyExactCorrection);
        window.requestAnimationFrame(() => window.requestAnimationFrame(applyExactCorrection));
        window.setTimeout(fallbackToDateTime, 50);
        if (pending.afterRecenter) {
          window.setTimeout(fallbackToDateTime, 100);
          window.setTimeout(applyExactCorrection, 220);
          window.setTimeout(applyExactCorrection, 500);
          window.setTimeout(applyExactCorrection, 1000);
          window.setTimeout(applyExactCorrection, 1500);
          window.setTimeout(applyExactCorrection, 2500);
        }
        return;
      }
      applyScrollCorrection(viewport, target);
      window.queueMicrotask(applyExactCorrection);
      window.requestAnimationFrame(applyExactCorrection);
      window.requestAnimationFrame(() => window.requestAnimationFrame(applyExactCorrection));
      window.setTimeout(applyExactCorrection, 0);
      window.setTimeout(applyExactCorrection, 50);
      if (pending.afterRecenter) {
        window.setTimeout(applyExactCorrection, 100);
        window.setTimeout(applyExactCorrection, 220);
        window.setTimeout(applyExactCorrection, 500);
        window.setTimeout(applyExactCorrection, 1000);
        window.setTimeout(applyExactCorrection, 1500);
        window.setTimeout(applyExactCorrection, 2500);
      }
    },
    [calendarRef, findEventTargetBox]
  );

  const clearActiveDraft = useCallback(() => {
    setActiveDraft(null);
    setDraftParticipantsChanged(false);
    activeDraftLastSeenSnapshotRef.current = null;
    activeEditSourceEventRef.current = null;
  }, []);

  const openCreateDraft = useCallback(
    (request: EventCreateRequest, source: "draw" | "button" = "draw") => {
      draftSequenceRef.current += 1;
      const draftId = `external-draft-${draftSequenceRef.current}`;
      const nextEvent = buildExternalCreateDraft(request, draftId, source);
      const drawnDraftSnapshot =
        source === "draw"
          ? (findEventTargetBox({
              snapshot: { top: 0, left: 0 },
              event: nextEvent,
              targetCalendarId: request.calendarId
            }) ?? findRenderedDraftBox())
          : null;
      if (drawnDraftSnapshot) {
        activeEditSourceEventRef.current = null;
        activeDraftLastSeenSnapshotRef.current = drawnDraftSnapshot;
        flushSync(() => {
          setDraftParticipantsChanged(false);
          setActiveDraft({ mode: "create", event: nextEvent });
        });
        restoreDraftScreenPositionNow({
          snapshot: drawnDraftSnapshot,
          eventId: draftId,
          event: nextEvent,
          afterRecenter: true,
          allowNavigationFallback: false,
          cancelOnManualScroll: true
        });
      } else {
        activeEditSourceEventRef.current = null;
        activeDraftLastSeenSnapshotRef.current = null;
        setDraftParticipantsChanged(false);
        setActiveDraft({ mode: "create", event: nextEvent });
      }
      setMessage(source === "button" ? "External create popup opened" : "Drawn range delegated to external popup");
    },
    [findEventTargetBox, findRenderedDraftBox, restoreDraftScreenPositionNow, setMessage]
  );

  const handleActivate = useCallback(
    (request: EventActivateRequest) => {
      const draftEvent = {
        ...request.event,
        calendarIds: eventParticipantIds(request.event)
      };
      activeEditSourceEventRef.current = draftEvent;
      activeDraftLastSeenSnapshotRef.current = findEventTargetBox({
        snapshot: { top: 0, left: 0 },
        eventId: request.event.id,
        event: draftEvent,
        targetCalendarId: firstPersonParticipantId(eventParticipantIds(draftEvent)) ?? draftEvent.calendarId
      });
      setDraftParticipantsChanged(false);
      setActiveDraft({
        mode: "edit",
        sourceEventId: request.event.id,
        event: draftEvent
      });
      setMessage(`Editing ${request.event.title} in external popup`);
    },
    [findEventTargetBox, setMessage]
  );

  const handleActiveDraftMove = useCallback((request: EventMoveRequest) => {
    expectedProgrammaticScrollRef.current = null;
    restoreTokenRef.current += 1;
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
  }, []);

  const focusDraftEvent = useCallback(
    (event: CalendarEvent, snapshot: DraftScreenSnapshot | null) => {
      const targetSnapshot = snapshot ?? activeDraftLastSeenSnapshotRef.current;
      if (!targetSnapshot) {
        calendarRef.current?.scrollToDateTime(isoDateInputValue(event.start), isoTimeInputValue(event.start));
        return;
      }
      restoreDraftScreenPositionNow({ snapshot: targetSnapshot, eventId: event.id, event, afterRecenter: true });
    },
    [calendarRef, restoreDraftScreenPositionNow]
  );

  const updateDraftEvent = useCallback(
    (updater: (event: CalendarEvent) => CalendarEvent) => {
      if (!activeDraft) {
        return;
      }
      const previousLastSeenSnapshot = activeDraftLastSeenSnapshotRef.current;
      const visibleSnapshot = findVisibleRenderedDraftBox(activeDraft.event.id);
      const nextEvent = updater(activeDraft.event);
      const geometryChanged =
        nextEvent.start !== activeDraft.event.start ||
        nextEvent.end !== activeDraft.event.end ||
        nextEvent.calendarId !== activeDraft.event.calendarId ||
        (nextEvent.calendarIds ?? []).join("|") !== (activeDraft.event.calendarIds ?? []).join("|");
      const dateChanged = nextEvent.start.slice(0, 10) !== activeDraft.event.start.slice(0, 10);
      expectedProgrammaticScrollRef.current = null;
      restoreTokenRef.current += 1;
      if (visibleSnapshot && dateChanged) {
        activeDraftLastSeenSnapshotRef.current = visibleSnapshot;
        flushSync(() => {
          setActiveDraft({ ...activeDraft, event: nextEvent });
        });
        const movedVisibleSnapshot = findVisibleRenderedDraftBox(nextEvent.id);
        if (movedVisibleSnapshot) {
          activeDraftLastSeenSnapshotRef.current = movedVisibleSnapshot;
          return;
        }
        restoreDraftScreenPositionNow({
          snapshot: visibleSnapshot,
          eventId: nextEvent.id,
          event: nextEvent,
          afterRecenter: true
        });
        return;
      }
      if (visibleSnapshot && geometryChanged) {
        activeDraftLastSeenSnapshotRef.current = visibleSnapshot;
        const viewport = document.querySelector<HTMLElement>(".ic-viewport");
        const scrollTop = viewport?.scrollTop ?? 0;
        const scrollLeft = viewport?.scrollLeft ?? 0;
        const restoreScroll = () => {
          if (!viewport) {
            return;
          }
          const viewportBox = viewport.getBoundingClientRect();
          const draftElement = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="draft-event"]')).find(
            (element) => element.dataset.eventId === nextEvent.id
          );
          const draftBox = draftElement?.getBoundingClientRect();
          if (
            !draftBox ||
            draftBox.width <= 0 ||
            draftBox.height <= 0 ||
            draftBox.right <= viewportBox.left ||
            draftBox.left >= viewportBox.right ||
            draftBox.bottom <= viewportBox.top ||
            draftBox.top >= viewportBox.bottom
          ) {
            return;
          }
          viewport.scrollTop = scrollTop;
          viewport.scrollLeft = scrollLeft;
        };
        setActiveDraft({ ...activeDraft, event: nextEvent });
        window.queueMicrotask(restoreScroll);
        window.requestAnimationFrame(restoreScroll);
        window.setTimeout(restoreScroll, 0);
        window.setTimeout(restoreScroll, 100);
        window.setTimeout(restoreScroll, 220);
        return;
      }
      if (visibleSnapshot && !geometryChanged) {
        const targetSnapshot = previousLastSeenSnapshot ?? visibleSnapshot;
        activeDraftLastSeenSnapshotRef.current = targetSnapshot;
        flushSync(() => {
          setActiveDraft({ ...activeDraft, event: nextEvent });
        });
        restoreDraftScreenPositionNow({
          snapshot: targetSnapshot,
          eventId: nextEvent.id,
          event: nextEvent,
          afterRecenter: true
        });
        return;
      }
      flushSync(() => {
        setActiveDraft({ ...activeDraft, event: nextEvent });
      });
      focusDraftEvent(nextEvent, visibleSnapshot);
    },
    [activeDraft, findVisibleRenderedDraftBox, focusDraftEvent, restoreDraftScreenPositionNow]
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
      const snapshot =
        (sourcePrimaryCalendarId ? findVisibleRenderedDraftBox(activeDraft.event.id, sourcePrimaryCalendarId) : null) ??
        findVisibleRenderedDraftBox(activeDraft.event.id) ??
        activeDraftLastSeenSnapshotRef.current;
      const nextEvent = updater(activeDraft.event);
      if (snapshot) {
        activeDraftLastSeenSnapshotRef.current = snapshot;
        document.querySelector<HTMLElement>(".ic-viewport")?.dispatchEvent(new Event("scroll"));
        flushSync(() => {
          setDraftParticipantsChanged(true);
          setActiveDraft({ ...activeDraft, event: nextEvent });
        });
        restoreDraftScreenPositionNow({
          snapshot,
          eventId: nextEvent.id,
          event: nextEvent,
          afterRecenter: true,
          allowNavigationFallback: false
        });
        return;
      }
      setDraftParticipantsChanged(true);
      setActiveDraft({ ...activeDraft, event: nextEvent });
    },
    [activeDraft, findVisibleRenderedDraftBox, restoreDraftScreenPositionNow]
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
    const snapshot = findRenderedDraftBox(activeDraft.event.id);

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
    if (snapshot) {
      restoreDraftScreenPositionNow({ snapshot, eventId: savedEvent.id, event: savedEvent, afterRecenter: true });
    }
  }, [activeDraft, clearActiveDraft, findRenderedDraftBox, restoreDraftScreenPositionNow, setEvents, setMessage]);

  const cancelActiveDraft = useCallback(() => {
    const sourceParticipantIds = activeEditSourceEventRef.current
      ? eventParticipantIds(activeEditSourceEventRef.current)
      : [];
    const sourcePrimaryCalendarId =
      firstPersonParticipantId(sourceParticipantIds) ??
      activeEditSourceEventRef.current?.calendarId ??
      activeDraft?.event.calendarId;
    const snapshot = activeDraft
      ? ((activeDraft.mode === "edit" && sourcePrimaryCalendarId
          ? findVisibleRenderedDraftBox(activeDraft.event.id, sourcePrimaryCalendarId)
          : null) ??
        (activeDraft.mode === "edit" ? activeDraftLastSeenSnapshotRef.current : null) ??
        findVisibleRenderedDraftBox(activeDraft.event.id) ??
        activeDraftLastSeenSnapshotRef.current)
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
    flushSync(() => {
      clearActiveDraft();
      setMessage("External popup cancelled");
    });
    if (snapshot && cancelledEvent) {
      restoreDraftScreenPositionNow({
        snapshot,
        eventId: sourceEventId,
        event: cancelledEvent,
        targetCalendarId: activeDraft?.mode === "edit" ? sourcePrimaryCalendarId : undefined,
        afterRecenter: true,
        allowNavigationFallback: false,
        cancelOnManualScroll: true
      });
    }
  }, [activeDraft, clearActiveDraft, findVisibleRenderedDraftBox, restoreDraftScreenPositionNow, setMessage]);

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
