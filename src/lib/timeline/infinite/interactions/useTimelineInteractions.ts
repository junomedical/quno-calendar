import { useCallback, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { CalendarHit } from "./timelineInteractionModel";
import { minutesSinceStartOfDay } from "#quno-internal/timeline/time/time";
import type {
  ActiveEventDraft,
  CalendarEvent,
  CalendarId,
  CalendarViewComponentProps,
  EventMoveRequest,
  EventRenderStatus,
  QunoInfiniteCalendarSettings
} from "#quno-internal/timeline/core/types";
import { useInteractionSelectionLock } from "#quno-internal/timeline/infinite/interactions/pointer/useInteractionSelectionLock";
import { useReleasedDraft } from "#quno-internal/timeline/infinite/interactions/draft/useReleasedDraft";
import { useGlobalPointerContinuation } from "#quno-internal/timeline/infinite/interactions/pointer/useGlobalPointerContinuation";
import { useTimelineDragInteraction } from "#quno-internal/timeline/infinite/interactions/drag/useTimelineDragInteraction";
import { useTimelineDraftInteraction } from "#quno-internal/timeline/infinite/interactions/draft/useTimelineDraftInteraction";

export type HoveredTimelineEvent = { eventId: string; calendarId: CalendarId } | null;
type PointerLike = Pick<PointerEvent | ReactPointerEvent, "clientX" | "clientY">;

type UseTimelineInteractionsArgs = {
  activeDraft?: ActiveEventDraft | null;
  interactionMode: NonNullable<CalendarViewComponentProps["interactionMode"]>;
  settings: QunoInfiniteCalendarSettings;
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

type EventPointerDownArgs = {
  event: ReactPointerEvent<HTMLDivElement>;
  calendarEvent: CalendarEvent;
  renderedCalendarId: CalendarId;
};

/** Coordinates the single Pointer Events lifecycle shared by both projections. */
export function useTimelineInteractions(args: UseTimelineInteractionsArgs) {
  const [hoveredEvent, setHoveredEvent] = useState<HoveredTimelineEvent>(null);
  const { releasedDraft, releaseActiveDraft } = useReleasedDraft({ activeDraft: args.activeDraft });
  const isActiveDraftEvent = useCallback(
    (event: CalendarEvent) => Boolean(args.activeDraft && event.id === args.activeDraft.event.id),
    [args.activeDraft]
  );
  const drag = useTimelineDragInteraction({
    settings: args.settings,
    getHit: args.getHit,
    isActiveDraftEvent,
    onEventMoveRequest: args.onEventMoveRequest,
    onEventActivate: args.onEventActivate,
    onActiveDraftMoveRequest: args.onActiveDraftMoveRequest,
    applyMoveToLoadedEvents: args.applyMoveToLoadedEvents
  });
  const draft = useTimelineDraftInteraction({
    interactionMode: args.interactionMode,
    getHit: args.getHit,
    onEventCreateRequest: args.onEventCreateRequest,
    onEventDraftRequest: args.onEventDraftRequest,
    applyCreatedEventToLoadedEvents: args.applyCreatedEventToLoadedEvents
  });
  const isInteractionActive = Boolean(drag.dragState || draft.draftState);
  const canStartDraft = Boolean(args.onEventCreateRequest || args.onEventDraftRequest);
  const canInteractWithPersistedEvents = Boolean(args.onEventMoveRequest || args.onEventActivate);
  useInteractionSelectionLock({ active: isInteractionActive });
  const { updateDragFromPoint, finishDrag, cancelDrag } = drag;
  const { updateDraftFromPoint, finishDraft, cancelDraft } = draft;

  const handleGridPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      !canStartDraft ||
      args.activeDraft ||
      (event.target as HTMLElement).closest("[data-event-id]") ||
      !args.isTimelinePoint(event)
    ) {
      return;
    }
    const hit = args.getHit(event);
    if (!hit) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    draft.startDraft(hit);
    setHoveredEvent(null);
  };

  const handleEventPointerDown = ({ event, calendarEvent, renderedCalendarId }: EventPointerDownArgs) => {
    event.stopPropagation();
    if (args.activeDraft && !isActiveDraftEvent(calendarEvent)) return;
    if ((args.interactionMode === "availability") !== (calendarEvent.kind === "availability")) return;
    const canInteract = isActiveDraftEvent(calendarEvent)
      ? Boolean(args.onActiveDraftMoveRequest)
      : Boolean(args.onEventMoveRequest || args.onEventActivate);
    if (!canInteract) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const pointerMinute = args.getHit(event)?.minute ?? minutesSinceStartOfDay({ value: calendarEvent.start });
    drag.startDrag({
      event: calendarEvent,
      sourceCalendarId: renderedCalendarId,
      offsetMinutes: pointerMinute - minutesSinceStartOfDay({ value: calendarEvent.start })
    });
    setHoveredEvent(null);
  };

  const updateInteraction = useCallback(
    (event: PointerLike) => {
      if (!updateDragFromPoint(event)) updateDraftFromPoint(event);
    },
    [updateDraftFromPoint, updateDragFromPoint]
  );
  const finishInteraction = useCallback(async () => {
    if (!(await finishDrag())) await finishDraft();
  }, [finishDraft, finishDrag]);
  const cancelInteraction = useCallback(() => {
    cancelDrag();
    cancelDraft();
    setHoveredEvent(null);
  }, [cancelDraft, cancelDrag]);

  useGlobalPointerContinuation({
    active: isInteractionActive,
    onMove: updateInteraction,
    onFinish: finishInteraction,
    onCancel: cancelInteraction
  });

  const renderedDraftStatus: EventRenderStatus = drag.draggingActiveDraft
    ? "dragging"
    : args.activeDraft
      ? args.activeDraft.mode === "edit"
        ? "existing"
        : "new"
      : draft.draftState
        ? "new"
        : (releasedDraft?.status ?? "new");

  return {
    hoveredEvent,
    setHoveredEvent,
    dragState: drag.dragState,
    draftState: draft.draftState,
    dragPreviewEvent: drag.dragPreviewEvent,
    releaseActiveDraft,
    renderedDraftEvent:
      args.activeDraft?.event.calendarIds?.length === 0
        ? null
        : (args.activeDraft?.event ?? draft.draftState?.event ?? releasedDraft?.draft.event ?? null),
    renderedDraftStatus,
    renderedDraftIsDraggable: Boolean(args.activeDraft && args.onActiveDraftMoveRequest),
    renderedDraftIsExiting: Boolean(!args.activeDraft && !draft.draftState && releasedDraft),
    renderedDraftReleaseDurationMs: !args.activeDraft && !draft.draftState ? releasedDraft?.durationMs : undefined,
    isInteractionActive,
    canStartDraft,
    canInteractWithPersistedEvents,
    handleGridPointerDown,
    handleEventPointerDown,
    handlePointerMove: (event: ReactPointerEvent<HTMLDivElement>) => updateInteraction(event),
    handlePointerUp: () => void finishInteraction(),
    handlePointerCancel: cancelInteraction
  };
}
