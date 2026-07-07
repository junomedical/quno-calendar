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
import { virtualOffsetForDate } from "../lib/date/dateVirtualization";
import { demoCalendars } from "./data";
import {
  addMinutesToIso,
  dateTimeToIso,
  draftParticipantIds,
  eventParticipantIds,
  isoDateInputValue,
  isoTimeInputValue
} from "./draftFormUtils";
import {
  findRenderedDraftBox,
  findVisibleRenderedDraftBox,
  type DraftScreenSnapshot
} from "./draftViewportUtils";

type PendingDraftRestore = {
  snapshot: DraftScreenSnapshot;
  event: CalendarEvent;
  eventId?: string;
  afterRecenter?: boolean;
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
  const [activeDraftBaseCalendarIds, setActiveDraftBaseCalendarIds] = useState<CalendarId[]>([]);
  const [draftParticipantsChanged, setDraftParticipantsChanged] = useState(false);
  const draftSequenceRef = useRef(0);
  const activeDraftLastSeenSnapshotRef = useRef<DraftScreenSnapshot | null>(null);

  const activeDraftParticipants = activeDraft ? draftParticipantIds(activeDraft.event) : [];
  const visibleCalendarIds = useMemo(() => {
    if (!activeDraft) {
      return selectedCalendarIds;
    }
    const shouldFilterCalendars = activeDraft.mode === "create" || draftParticipantsChanged;
    if (!shouldFilterCalendars) {
      return selectedCalendarIds;
    }
    return activeDraftParticipants.length > 0
      ? activeDraftParticipants
      : activeDraftBaseCalendarIds.length > 0
        ? activeDraftBaseCalendarIds
        : selectedCalendarIds;
  }, [activeDraft, activeDraftBaseCalendarIds, activeDraftParticipants, draftParticipantsChanged, selectedCalendarIds]);
  const canSaveActiveDraft = !activeDraft || activeDraftParticipants.length > 0;

  const restoreVirtualDraftPosition = useCallback((pending: PendingDraftRestore) => {
    const viewport = document.querySelector<HTMLElement>(".ic-viewport");
    const firstDay = document.querySelector<HTMLElement>('[data-testid="calendar-day"][data-date]');
    if (!viewport || !firstDay) {
      return;
    }
    const firstDateKey = firstDay.dataset.date;
    if (!firstDateKey) {
      return;
    }
    const targetDateKey = pending.event.start.slice(0, 10);
    const offsetDays = virtualOffsetForDate(firstDateKey, targetDateKey, calendarSettings.excludedWeekdays);
    const rowElements = Array.from(firstDay.querySelectorAll<HTMLElement>('[data-testid="calendar-row"]'));
    const rowIndex = rowElements.findIndex((row) => row.dataset.calendarId === pending.event.calendarId);
    const isVerticalView = Boolean(firstDay.querySelector(".icv-day-board"));
    const minutes = new Date(pending.event.start).getHours() * 60 + new Date(pending.event.start).getMinutes();
    const timelineOffset = 8 + (minutes - calendarSettings.startHour * 60) * Math.max(0.5, calendarSettings.zoom);
    const dayHeight = isVerticalView
      ? calendarSettings.dayHeaderHeight + (calendarSettings.endHour - calendarSettings.startHour) * 60 * Math.max(0.5, calendarSettings.zoom) + 16
      : calendarSettings.dayHeaderHeight + Math.max(1, rowElements.length) * calendarSettings.rowHeight;
    const topWithinDate = isVerticalView
      ? calendarSettings.dayHeaderHeight + timelineOffset
      : calendarSettings.dayHeaderHeight + Math.max(0, rowIndex) * calendarSettings.rowHeight;
    viewport.scrollTop = Math.max(0, firstDay.offsetTop + offsetDays * dayHeight + topWithinDate - pending.snapshot.top);
  }, [calendarSettings]);

  const findEventTargetBox = useCallback((pending: PendingDraftRestore): DraftScreenSnapshot | null => {
    const viewport = document.querySelector<HTMLElement>(".ic-viewport");
    if (!viewport) {
      return null;
    }
    const eventElements = pending.eventId
      ? Array.from(
          document.querySelectorAll<HTMLElement>(
            '[data-testid="draft-event"], [data-testid="calendar-event"], [data-testid="availability-event"]'
          )
        ).filter((element) => element.dataset.eventId === pending.eventId)
      : [];
    const viewportBox = viewport.getBoundingClientRect();
    const eventElement = eventElements.find((element) => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && box.right > viewportBox.left && box.left < viewportBox.right && box.bottom > viewportBox.top && box.top < viewportBox.bottom;
    }) ?? eventElements[0] ?? null;
    if (eventElement) {
      const eventBox = eventElement.getBoundingClientRect();
      return {
        top: eventBox.top - viewportBox.top,
        left: eventBox.left - viewportBox.left
      };
    }

    const dateKey = pending.event.start.slice(0, 10);
    const calendarId = pending.event.calendarId;
    const dayElement = document.querySelector<HTMLElement>(`[data-testid="calendar-day"][data-date="${dateKey}"]`);
    const horizontalRow = dayElement?.querySelector<HTMLElement>(`[data-testid="calendar-row"][data-calendar-id="${calendarId}"]`);
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

    const verticalColumn = dayElement?.querySelector<HTMLElement>(`[data-testid="calendar-column"][data-calendar-id="${calendarId}"]`);
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
  }, [calendarSettings]);

  const restoreDraftScreenPositionNow = useCallback((pending: PendingDraftRestore | null) => {
    if (!pending) {
      return;
    }
    const applyExactCorrection = () => {
      const nextViewport = document.querySelector<HTMLElement>(".ic-viewport");
      const nextTarget = findEventTargetBox(pending);
      if (!nextViewport || !nextTarget) {
        return;
      }
      nextViewport.scrollTop += nextTarget.top - pending.snapshot.top;
      nextViewport.scrollLeft += nextTarget.left - pending.snapshot.left;
    };
    const viewport = document.querySelector<HTMLElement>(".ic-viewport");
    let target = findEventTargetBox(pending);
    if (!target) {
      flushSync(() => {
        calendarRef.current?.scrollToDateTime(isoDateInputValue(pending.event.start), isoTimeInputValue(pending.event.start));
      });
      target = findEventTargetBox(pending);
    }
    if (!viewport || !target) {
      restoreVirtualDraftPosition(pending);
      window.requestAnimationFrame(applyExactCorrection);
      window.requestAnimationFrame(() => window.requestAnimationFrame(applyExactCorrection));
      window.setTimeout(applyExactCorrection, 50);
      if (pending.afterRecenter) {
        window.setTimeout(applyExactCorrection, 100);
        window.setTimeout(applyExactCorrection, 220);
        window.setTimeout(applyExactCorrection, 500);
        window.setTimeout(applyExactCorrection, 1000);
        window.setTimeout(applyExactCorrection, 1500);
        window.setTimeout(applyExactCorrection, 2500);
      }
      return;
    }
    viewport.scrollTop += target.top - pending.snapshot.top;
    viewport.scrollLeft += target.left - pending.snapshot.left;
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
  }, [calendarRef, findEventTargetBox, restoreVirtualDraftPosition]);

  const clearActiveDraft = useCallback(() => {
    setActiveDraft(null);
    setActiveDraftBaseCalendarIds([]);
    setDraftParticipantsChanged(false);
    activeDraftLastSeenSnapshotRef.current = null;
  }, []);

  const resetActiveDraft = useCallback(() => {
    clearActiveDraft();
  }, [clearActiveDraft]);

  const openCreateDraft = useCallback((request: EventCreateRequest, source: "draw" | "button" = "draw") => {
    draftSequenceRef.current += 1;
    const calendar = demoCalendars.find((candidate) => candidate.id === request.calendarId) ?? demoCalendars[0];
    const draftId = `external-draft-${draftSequenceRef.current}`;
    const drawnDraftSnapshot = source === "draw" ? findRenderedDraftBox() : null;
    const nextEvent: CalendarEvent = {
      id: draftId,
      calendarId: calendar.id,
      calendarIds: [calendar.id],
      title: request.kind === "availability" ? "Available" : "New appointment",
      subtitle: source === "button" ? "External button draft" : "External popup draft",
      start: request.start,
      end: request.end,
      color: calendar.color,
      kind: request.kind === "availability" ? "availability" : "draft"
    };
    if (drawnDraftSnapshot) {
      activeDraftLastSeenSnapshotRef.current = drawnDraftSnapshot;
      flushSync(() => {
        setActiveDraftBaseCalendarIds(selectedCalendarIds);
        setDraftParticipantsChanged(false);
        setActiveDraft({ mode: "create", event: nextEvent });
      });
      restoreDraftScreenPositionNow({ snapshot: drawnDraftSnapshot, eventId: draftId, event: nextEvent, afterRecenter: true });
    } else {
      activeDraftLastSeenSnapshotRef.current = null;
      setActiveDraftBaseCalendarIds(selectedCalendarIds);
      setDraftParticipantsChanged(false);
      setActiveDraft({ mode: "create", event: nextEvent });
    }
    setMessage(source === "button" ? "External create popup opened" : "Drawn range delegated to external popup");
  }, [findRenderedDraftBox, restoreDraftScreenPositionNow, selectedCalendarIds, setMessage]);

  const handleActivate = useCallback((request: EventActivateRequest) => {
    activeDraftLastSeenSnapshotRef.current = findVisibleRenderedDraftBox(request.event.id);
    setActiveDraftBaseCalendarIds(selectedCalendarIds);
    setDraftParticipantsChanged(false);
    setActiveDraft({
      mode: "edit",
      sourceEventId: request.event.id,
      event: {
        ...request.event,
        calendarIds: eventParticipantIds(request.event)
      }
    });
    setMessage(`Editing ${request.event.title} in external popup`);
  }, [findVisibleRenderedDraftBox, selectedCalendarIds, setMessage]);

  const handleActiveDraftMove = useCallback((request: EventMoveRequest) => {
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

  const focusDraftEvent = useCallback((event: CalendarEvent, snapshot: DraftScreenSnapshot | null) => {
    const targetSnapshot = snapshot ?? activeDraftLastSeenSnapshotRef.current;
    if (!targetSnapshot) {
      calendarRef.current?.scrollToDateTime(isoDateInputValue(event.start), isoTimeInputValue(event.start));
      return;
    }
    restoreDraftScreenPositionNow({ snapshot: targetSnapshot, eventId: event.id, event, afterRecenter: true });
  }, [calendarRef, restoreDraftScreenPositionNow]);

  const updateDraftEvent = useCallback((updater: (event: CalendarEvent) => CalendarEvent) => {
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
    if (visibleSnapshot && dateChanged) {
      activeDraftLastSeenSnapshotRef.current = visibleSnapshot;
      flushSync(() => {
        setActiveDraft({ ...activeDraft, event: nextEvent });
      });
      restoreDraftScreenPositionNow({ snapshot: visibleSnapshot, eventId: nextEvent.id, event: nextEvent, afterRecenter: true });
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
      restoreDraftScreenPositionNow({ snapshot: targetSnapshot, eventId: nextEvent.id, event: nextEvent, afterRecenter: true });
      return;
    }
    flushSync(() => {
      setActiveDraft({ ...activeDraft, event: nextEvent });
    });
    focusDraftEvent(nextEvent, visibleSnapshot);
  }, [activeDraft, findVisibleRenderedDraftBox, focusDraftEvent]);

  const updateDraftParticipants = useCallback((updater: (event: CalendarEvent) => CalendarEvent) => {
    if (!activeDraft) {
      return;
    }
    const snapshot = findRenderedDraftBox(activeDraft.event.id) ?? activeDraftLastSeenSnapshotRef.current;
    const nextEvent = updater(activeDraft.event);
    if (snapshot) {
      activeDraftLastSeenSnapshotRef.current = snapshot;
      flushSync(() => {
        setDraftParticipantsChanged(true);
        setActiveDraft({ ...activeDraft, event: nextEvent });
      });
      restoreDraftScreenPositionNow({ snapshot, eventId: nextEvent.id, event: nextEvent, afterRecenter: true });
      return;
    }
    setDraftParticipantsChanged(true);
    setActiveDraft({ ...activeDraft, event: nextEvent });
  }, [activeDraft, findRenderedDraftBox, restoreDraftScreenPositionNow]);

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
      activeDraft.event.kind === "availability" ? "availability" : activeDraft.event.kind === "blocked" ? "blocked" : "appointment";
    const savedEvent: CalendarEvent = {
      ...activeDraft.event,
      id: activeDraft.mode === "edit" ? activeDraft.sourceEventId ?? activeDraft.event.id : `created-${Date.now()}`,
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
    const snapshot = activeDraft ? findRenderedDraftBox(activeDraft.event.id) ?? activeDraftLastSeenSnapshotRef.current : null;
    const cancelledEvent = activeDraft?.event ?? null;
    const sourceEventId = activeDraft?.mode === "edit" ? activeDraft.sourceEventId ?? activeDraft.event.id : undefined;
    flushSync(() => {
      clearActiveDraft();
      setMessage("External popup cancelled");
    });
    if (snapshot && cancelledEvent) {
      restoreDraftScreenPositionNow({ snapshot, eventId: sourceEventId, event: cancelledEvent, afterRecenter: true });
    }
  }, [activeDraft, clearActiveDraft, findRenderedDraftBox, restoreDraftScreenPositionNow, setMessage]);

  const toggleDraftParticipant = useCallback((calendarId: CalendarId, checked: boolean) => {
    updateDraftParticipants((event) => {
      const currentIds = draftParticipantIds(event);
      const nextIds = checked
        ? Array.from(new Set([...currentIds, calendarId]))
        : currentIds.filter((candidate) => candidate !== calendarId);
      const firstCalendarId = nextIds[0] ?? event.calendarId;
      const firstCalendar = demoCalendars.find((calendar) => calendar.id === firstCalendarId);
      return {
        ...event,
        calendarId: firstCalendarId,
        calendarIds: nextIds,
        color: firstCalendar?.color ?? event.color
      };
    });
  }, [updateDraftParticipants]);

  return {
    activeDraft,
    visibleCalendarIds,
    canSaveActiveDraft,
    resetActiveDraft,
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
