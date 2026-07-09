import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent
} from "react";
import { type CalendarHit } from "../../interaction/interactions";
import { minutesSinceStartOfDay } from "../../time/time";
import {
  type ActiveEventDraft,
  type ActiveDraftReleaseOptions,
  type CalendarEvent,
  type CalendarId,
  type CalendarViewComponentProps,
  type EventRenderStatus,
  type EventMoveRequest,
  type TimelineSettings
} from "../../core/types";
import { useTimelineDragInteraction } from "./useTimelineDragInteraction";
import { useTimelineDraftInteraction } from "./useTimelineDraftInteraction";

export type HoveredTimelineEvent = { eventId: string; calendarId: CalendarId } | null;

const DEFAULT_DRAFT_RELEASE_DURATION_MS = 220;

type PointerLike = Pick<PointerEvent | MouseEvent | ReactPointerEvent | ReactMouseEvent, "clientX" | "clientY">;

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
  const [releasedDraft, setReleasedDraft] = useState<{
    draft: ActiveEventDraft;
    status: EventRenderStatus;
    durationMs: number;
  } | null>(null);
  const activeDraftRef = useRef<ActiveEventDraft | null>(activeDraft ?? null);
  const releaseTimerRef = useRef<number | null>(null);
  activeDraftRef.current = activeDraft ?? null;

  const clearReleaseTimer = useCallback(() => {
    if (releaseTimerRef.current === null) {
      return;
    }
    window.clearTimeout(releaseTimerRef.current);
    releaseTimerRef.current = null;
  }, []);

  const releaseActiveDraft = useCallback(
    (options: ActiveDraftReleaseOptions = {}) => {
      const draft = activeDraftRef.current;
      clearReleaseTimer();
      if (!draft || options.animation === "none") {
        setReleasedDraft(null);
        return;
      }

      const durationMs = options.durationMs ?? DEFAULT_DRAFT_RELEASE_DURATION_MS;
      setReleasedDraft({
        draft,
        status: draft.mode === "edit" ? "existing" : "new",
        durationMs
      });
      releaseTimerRef.current = window.setTimeout(() => {
        setReleasedDraft(null);
        releaseTimerRef.current = null;
      }, durationMs);
    },
    [clearReleaseTimer]
  );

  useEffect(() => {
    if (!activeDraft) {
      return;
    }
    clearReleaseTimer();
    setReleasedDraft(null);
  }, [activeDraft, clearReleaseTimer]);

  useEffect(() => clearReleaseTimer, [clearReleaseTimer]);

  const isActiveDraftEvent = useCallback(
    (event: CalendarEvent) => Boolean(activeDraft && event.id === activeDraft.event.id),
    [activeDraft]
  );
  const { dragState, draggingActiveDraft, dragPreviewEvent, startDrag, updateDragFromPoint, finishDrag } =
    useTimelineDragInteraction({
      settings,
      getHit,
      isActiveDraftEvent,
      onEventMoveRequest,
      onEventActivate,
      onActiveDraftMoveRequest,
      applyMoveToLoadedEvents
    });
  const { draftState, startDraft, updateDraftFromPoint, finishDraft } = useTimelineDraftInteraction({
    interactionMode,
    getHit,
    onEventCreateRequest,
    onEventDraftRequest,
    applyCreatedEventToLoadedEvents
  });

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
    startDraft(hit);
    setHoveredEvent(null);
  };

  const handleGridMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (
      activeDraft ||
      (event.target as HTMLElement).closest("[data-event-id]") ||
      dragState ||
      draftState ||
      !isTimelinePoint(event)
    ) {
      return;
    }
    const hit = getHit(event);
    if (!hit) {
      return;
    }
    event.preventDefault();
    startDraft(hit);
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
    startDrag(event, renderedCalendarId, pointerMinute - minutesSinceStartOfDay(event.start));
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
    startDrag(event, renderedCalendarId, pointerMinute - minutesSinceStartOfDay(event.start));
    setHoveredEvent(null);
  };

  const updateInteractionFromPoint = useCallback(
    (event: PointerLike) => {
      if (updateDragFromPoint(event)) {
        return;
      }

      updateDraftFromPoint(event);
    },
    [updateDraftFromPoint, updateDragFromPoint]
  );

  const finishInteraction = useCallback(async () => {
    if (await finishDrag()) {
      return;
    }

    await finishDraft();
  }, [finishDraft, finishDrag]);

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

  const renderedDraftStatus: EventRenderStatus = draggingActiveDraft
    ? "dragging"
    : activeDraft
      ? activeDraft.mode === "edit"
        ? "existing"
        : "new"
      : draftState
        ? "new"
        : (releasedDraft?.status ?? "new");

  return {
    hoveredEvent,
    setHoveredEvent,
    dragState,
    draftState,
    draggingActiveDraft,
    dragPreviewEvent,
    releaseActiveDraft,
    renderedDraftEvent: activeDraft?.event ?? draftState?.event ?? releasedDraft?.draft.event ?? null,
    renderedDraftStatus,
    renderedDraftIsDraggable: Boolean(activeDraft),
    renderedDraftIsExiting: Boolean(!activeDraft && !draftState && releasedDraft),
    renderedDraftReleaseDurationMs: !activeDraft && !draftState ? releasedDraft?.durationMs : undefined,
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
