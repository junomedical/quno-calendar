import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent
} from "react";
import { eventCalendarIds, replaceEventCalendarMembership } from "../../data/calendarEvents";
import { buildDraftEvent, buildMoveProposal, type CalendarHit } from "../../interaction/interactions";
import { minutesSinceStartOfDay } from "../../time/time";
import {
  type ActiveEventDraft,
  type CalendarEvent,
  type CalendarId,
  type CalendarViewComponentProps,
  type EventRenderStatus,
  type EventMoveRequest,
  type TimelineSettings
} from "../../core/types";
import { sameMoveRequest } from "../utils/infiniteTimelineUtils";

export type HoveredTimelineEvent = { eventId: string; calendarId: CalendarId } | null;

type PointerLike = Pick<PointerEvent | MouseEvent | ReactPointerEvent | ReactMouseEvent, "clientX" | "clientY">;

type DragState = {
  event: CalendarEvent;
  sourceCalendarId: CalendarId;
  offsetMinutes: number;
  preview: EventMoveRequest | null;
};

type DraftState = {
  start: CalendarHit;
  current: CalendarHit;
  event: CalendarEvent;
};

type UseTimelineInteractionsArgs = {
  activeDraft?: ActiveEventDraft | null;
  interactionMode: NonNullable<CalendarViewComponentProps["interactionMode"]>;
  settings: TimelineSettings;
  getHit: (event: PointerLike) => CalendarHit | null;
  isTimelinePoint: (event: PointerLike) => boolean;
  onEventMoveRequest?: CalendarViewComponentProps["onEventMoveRequest"];
  onEventCreateRequest?: CalendarViewComponentProps["onEventCreateRequest"];
  onEventDraftRequest?: CalendarViewComponentProps["onEventDraftRequest"];
  onEventActivate?: CalendarViewComponentProps["onEventActivate"];
  onActiveDraftMoveRequest?: CalendarViewComponentProps["onActiveDraftMoveRequest"];
  applyMoveToLoadedEvents: (request: EventMoveRequest) => void;
  applyCreatedEventToLoadedEvents: (event: CalendarEvent) => void;
};

export function useTimelineInteractions({
  activeDraft,
  interactionMode,
  settings,
  getHit,
  isTimelinePoint,
  onEventMoveRequest,
  onEventCreateRequest,
  onEventDraftRequest,
  onEventActivate,
  onActiveDraftMoveRequest,
  applyMoveToLoadedEvents,
  applyCreatedEventToLoadedEvents
}: UseTimelineInteractionsArgs) {
  const [hoveredEvent, setHoveredEvent] = useState<HoveredTimelineEvent>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [draftState, setDraftState] = useState<DraftState | null>(null);
  const createdEventSequenceRef = useRef(0);

  const isActiveDraftEvent = useCallback(
    (event: CalendarEvent) => Boolean(activeDraft && event.id === activeDraft.event.id),
    [activeDraft]
  );

  const handleGridPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activeDraft || (event.target as HTMLElement).closest("[data-event-id]") || !isTimelinePoint(event)) {
      return;
    }
    const hit = getHit(event);
    if (!hit) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraftState({ start: hit, current: hit, event: buildDraftEvent(hit, hit, interactionMode === "availability" ? "availability" : "draft") });
    setHoveredEvent(null);
  };

  const handleGridMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (activeDraft || (event.target as HTMLElement).closest("[data-event-id]") || dragState || draftState || !isTimelinePoint(event)) {
      return;
    }
    const hit = getHit(event);
    if (!hit) {
      return;
    }
    event.preventDefault();
    setDraftState({ start: hit, current: hit, event: buildDraftEvent(hit, hit, interactionMode === "availability" ? "availability" : "draft") });
    setHoveredEvent(null);
  };

  const handleEventPointerDown = (
    pointerEvent: ReactPointerEvent<HTMLDivElement>,
    event: CalendarEvent,
    renderedCalendarId: CalendarId
  ) => {
    pointerEvent.stopPropagation();
    if (activeDraft && !isActiveDraftEvent(event)) {
      return;
    }
    if ((interactionMode === "availability") !== (event.kind === "availability")) {
      return;
    }
    pointerEvent.preventDefault();
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
    const hit = getHit(pointerEvent);
    const pointerMinute = hit?.minute ?? minutesSinceStartOfDay(event.start);
    setDragState({
      event,
      sourceCalendarId: renderedCalendarId,
      offsetMinutes: pointerMinute - minutesSinceStartOfDay(event.start),
      preview: null
    });
    setHoveredEvent(null);
  };

  const handleEventMouseDown = (
    mouseEvent: ReactMouseEvent<HTMLDivElement>,
    event: CalendarEvent,
    renderedCalendarId: CalendarId
  ) => {
    mouseEvent.stopPropagation();
    if (activeDraft && !isActiveDraftEvent(event)) {
      return;
    }
    if ((interactionMode === "availability") !== (event.kind === "availability")) {
      return;
    }
    mouseEvent.preventDefault();
    const hit = getHit(mouseEvent);
    const pointerMinute = hit?.minute ?? minutesSinceStartOfDay(event.start);
    setDragState({
      event,
      sourceCalendarId: renderedCalendarId,
      offsetMinutes: pointerMinute - minutesSinceStartOfDay(event.start),
      preview: null
    });
    setHoveredEvent(null);
  };

  const updateInteractionFromPoint = useCallback(
    (event: PointerLike) => {
      if (dragState) {
        const hit = getHit(event);
        if (!hit) {
          return;
        }
        const baseProposal = buildMoveProposal(dragState.event, hit, dragState.offsetMinutes, settings);
        const draggingActiveDraft = isActiveDraftEvent(dragState.event);
        const currentCalendarIds = eventCalendarIds(dragState.event);
        const proposal: EventMoveRequest = {
          ...baseProposal,
          proposedCalendarId: draggingActiveDraft && currentCalendarIds.length > 1 ? dragState.event.calendarId : baseProposal.proposedCalendarId,
          sourceCalendarId: dragState.sourceCalendarId,
          proposedCalendarIds:
            draggingActiveDraft && currentCalendarIds.length > 1
              ? currentCalendarIds
              : replaceEventCalendarMembership(dragState.event, dragState.sourceCalendarId, baseProposal.proposedCalendarId)
        };
        if (draggingActiveDraft && !sameMoveRequest(proposal, dragState.preview)) {
          onActiveDraftMoveRequest?.(proposal);
        }
        setDragState((current) => {
          if (!current || sameMoveRequest(proposal, current.preview)) {
            return current;
          }
          return { ...current, preview: proposal };
        });
        return;
      }

      if (draftState) {
        const hit = getHit(event);
        if (!hit || hit.dateKey !== draftState.start.dateKey || hit.calendarId !== draftState.start.calendarId) {
          return;
        }
        setDraftState({
          start: draftState.start,
          current: hit,
          event: buildDraftEvent(draftState.start, hit, interactionMode === "availability" ? "availability" : "draft")
        });
      }
    },
    [draftState, dragState, getHit, interactionMode, isActiveDraftEvent, onActiveDraftMoveRequest, settings]
  );

  const finishInteraction = useCallback(async () => {
    if (dragState) {
      const proposal = dragState.preview;
      if (isActiveDraftEvent(dragState.event)) {
        setDragState(null);
        return;
      }
      if (proposal && onEventMoveRequest) {
        const accepted = await onEventMoveRequest(proposal);
        if (accepted !== false) {
          applyMoveToLoadedEvents(proposal);
        }
      } else if (!proposal && onEventActivate) {
        onEventActivate({ event: dragState.event, renderedCalendarId: dragState.sourceCalendarId });
      }
      setDragState(null);
      return;
    }

    if (draftState) {
      const draft = draftState.event;
      if (minutesSinceStartOfDay(draft.end) > minutesSinceStartOfDay(draft.start)) {
        const request = {
          start: draft.start,
          end: draft.end,
          calendarId: draft.calendarId,
          kind: draft.kind
        };
        if (onEventDraftRequest) {
          onEventDraftRequest(request);
          setDraftState(null);
        } else if (onEventCreateRequest) {
          setDraftState(null);
          const createdEvent = await onEventCreateRequest(request);
          createdEventSequenceRef.current += 1;
          applyCreatedEventToLoadedEvents(
            createdEvent ?? {
              ...draft,
              id: `created-local-${createdEventSequenceRef.current}`,
              subtitle: "Created from drawn area"
            }
          );
        }
      } else {
        setDraftState(null);
      }
    }
  }, [
    applyCreatedEventToLoadedEvents,
    applyMoveToLoadedEvents,
    draftState,
    dragState,
    onEventActivate,
    onEventCreateRequest,
    onEventDraftRequest,
    isActiveDraftEvent,
    onEventMoveRequest
  ]);

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => updateInteractionFromPoint(event);
  const handleMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => updateInteractionFromPoint(event);
  const handlePointerUp = () => {
    void finishInteraction();
  };

  useEffect(() => {
    if (!dragState && !draftState) {
      return;
    }

    const handleWindowMove = (event: PointerEvent | MouseEvent) => {
      event.preventDefault();
      document.getSelection()?.removeAllRanges();
      updateInteractionFromPoint(event);
    };
    const handleWindowUp = () => {
      void finishInteraction();
    };

    window.addEventListener("pointermove", handleWindowMove);
    window.addEventListener("mousemove", handleWindowMove);
    window.addEventListener("pointerup", handleWindowUp);
    window.addEventListener("mouseup", handleWindowUp);

    return () => {
      window.removeEventListener("pointermove", handleWindowMove);
      window.removeEventListener("mousemove", handleWindowMove);
      window.removeEventListener("pointerup", handleWindowUp);
      window.removeEventListener("mouseup", handleWindowUp);
    };
  }, [draftState, dragState, finishInteraction, updateInteractionFromPoint]);

  useEffect(() => {
    if (!dragState && !draftState) {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;
    const previousDocumentUserSelect = document.documentElement.style.userSelect;
    document.body.style.userSelect = "none";
    document.documentElement.style.userSelect = "none";
    document.getSelection()?.removeAllRanges();
    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.documentElement.style.userSelect = previousDocumentUserSelect;
      document.getSelection()?.removeAllRanges();
    };
  }, [draftState, dragState]);

  const draggingActiveDraft = Boolean(dragState && isActiveDraftEvent(dragState.event));
  const dragPreviewEvent = dragState?.preview && !draggingActiveDraft
    ? {
        ...dragState.event,
        calendarId: dragState.preview.proposedCalendarId,
        calendarIds: dragState.preview.proposedCalendarIds,
        start: dragState.preview.proposedStart,
        end: dragState.preview.proposedEnd
      }
    : null;
  const renderedDraftStatus: EventRenderStatus = draggingActiveDraft ? "dragging" : activeDraft?.mode === "edit" ? "existing" : "new";

  return {
    hoveredEvent,
    setHoveredEvent,
    dragState,
    draftState,
    draggingActiveDraft,
    dragPreviewEvent,
    renderedDraftEvent: activeDraft?.event ?? draftState?.event ?? null,
    renderedDraftStatus,
    renderedDraftIsDraggable: Boolean(activeDraft),
    isInteractionActive: Boolean(dragState || draftState),
    handleGridPointerDown,
    handleGridMouseDown,
    handleEventPointerDown,
    handleEventMouseDown,
    handlePointerMove,
    handleMouseMove,
    handlePointerUp
  };
}
