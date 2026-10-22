import { useCallback, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { CalendarHit } from "./timelineInteractionModel";
import { useTimelinePointerStart } from "#quno-internal/timeline/infinite/interactions/pointer/useTimelinePointerStart";
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
import { useTimelinePointerFrames } from "#quno-internal/timeline/infinite/interactions/pointer/useTimelinePointerFrames";

export type HoveredTimelineEvent = { eventId: string; calendarId: CalendarId; dateKey?: string } | null;
type PointerLike = Pick<PointerEvent | ReactPointerEvent, "clientX" | "clientY">;

export type UseTimelineInteractionsArgs = {
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

export type EventPointerDownArgs = {
  event: ReactPointerEvent<HTMLDivElement>;
  calendarEvent: CalendarEvent;
  renderedCalendarId: CalendarId;
  renderedDateKey?: import("#quno-internal/shared/dateRangeModel").IsoDate;
};

function resolveDraftRenderState({
  activeDraft,
  draggingActiveDraft,
  localDraftEvent,
  releasedEvent,
  releasedStatus
}: {
  activeDraft?: ActiveEventDraft | null;
  draggingActiveDraft: boolean;
  localDraftEvent?: CalendarEvent | null;
  releasedEvent?: CalendarEvent;
  releasedStatus?: EventRenderStatus;
}) {
  return {
    renderedDraftEvent:
      activeDraft?.event.calendarIds?.length === 0
        ? null
        : (activeDraft?.event ?? localDraftEvent ?? releasedEvent ?? null),
    renderedDraftStatus: draggingActiveDraft
      ? ("dragging" as const)
      : activeDraft
        ? activeDraft.mode === "edit"
          ? ("existing" as const)
          : ("new" as const)
        : localDraftEvent
          ? ("new" as const)
          : (releasedStatus ?? "new")
  };
}

function useIsActiveDraftEvent({ activeDraft }: Pick<UseTimelineInteractionsArgs, "activeDraft">) {
  return useCallback(
    (event: CalendarEvent) => Boolean(activeDraft && event.id === activeDraft.event.id),
    [activeDraft]
  );
}

/** Coordinates the single Pointer Events lifecycle shared by both projections. */
export function useTimelineInteractions(args: UseTimelineInteractionsArgs) {
  const [hoveredEvent, setHoveredEvent] = useState<HoveredTimelineEvent>(null);
  const { releasedDraft, releaseActiveDraft } = useReleasedDraft({ activeDraft: args.activeDraft });
  const isActiveDraftEvent = useIsActiveDraftEvent({ activeDraft: args.activeDraft });
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
  const {
    schedule: schedulePointerMove,
    finishFromPoint,
    cancelFromPointer
  } = useTimelinePointerFrames({
    update: updateInteraction,
    observe: drag.trackPointerMovement,
    finish: finishInteraction,
    cancel: cancelInteraction
  });

  const pointerStart = useTimelinePointerStart({
    args,
    drag,
    draft,
    clearHover: () => setHoveredEvent(null),
    cancel: cancelFromPointer
  });

  useGlobalPointerContinuation({
    active: isInteractionActive,
    onMove: schedulePointerMove,
    onFinish: finishFromPoint,
    onCancel: cancelFromPointer
  });

  const draftRenderState = resolveDraftRenderState({
    activeDraft: args.activeDraft,
    draggingActiveDraft: drag.draggingActiveDraft,
    localDraftEvent: draft.draftState?.event,
    releasedEvent: releasedDraft?.draft.event,
    releasedStatus: releasedDraft?.status
  });

  return {
    hoveredEvent,
    setHoveredEvent,
    dragState: drag.dragState,
    draftState: draft.draftState,
    dragPreviewEvent: drag.dragPreviewEvent,
    releaseActiveDraft,
    ...draftRenderState,
    renderedDraftIsDraggable: Boolean(args.activeDraft && args.onActiveDraftMoveRequest),
    renderedDraftIsExiting: Boolean(!args.activeDraft && !draft.draftState && releasedDraft),
    renderedDraftReleaseDurationMs: !args.activeDraft && !draft.draftState ? releasedDraft?.durationMs : undefined,
    isInteractionActive,
    canStartDraft,
    canInteractWithPersistedEvents,
    ...pointerStart,
    handlePointerMove: schedulePointerMove,
    handlePointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void finishFromPoint(event),
    handlePointerCancel: cancelFromPointer
  };
}
