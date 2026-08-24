import { useCallback, useMemo, useRef, useState, type SetStateAction } from "react";
import {
  type CalendarEvent,
  type QunoCalendarHandle,
  type EventCreateRequest,
  type EventMoveRequest
} from "@quno/calendar/timeline";
import { createDemoEvents, createRangeLoader, demoCalendars, appendCreatedEvent, applyMove } from "./data";
import { DemoEventCard } from "./DemoEventCard";
import { DefaultDemoSidebar } from "./default/DefaultDemoSidebar";
import { useDraftSaveSimulation } from "./default/useDraftSaveSimulation";
import { dateInputValue, timeInputValue } from "./draftFormUtils";
import { ExternalEventPopup } from "./ExternalEventPopup";
import { useDemoControls, type DemoControlDefaults, type DemoLayoutSettings } from "./hooks/useDemoControls";
import { useSimulatedApiLoader } from "./hooks/useSimulatedApiLoader";
import { useSystemNow } from "./hooks/useSystemNow";
import { useViewportActivityLog } from "./hooks/useViewportActivityLog";
import type { DemoRoute } from "./types";
import { useExternalEventDrafts } from "./useExternalEventDrafts";
import { DemoQunoCalendar, DemoZoomProvider } from "./zoom/DemoZoom";

const defaultLayout: DemoLayoutSettings = {
  rowHeight: 50,
  dayHeaderHeight: 42,
  labelWidth: 230,
  verticalColumnMinWidth: 240,
  verticalColumnOverlapCapacity: 3,
  verticalColumnOverlapGrowth: 80,
  verticalEventHoverMinHeight: 64
};

const MAX_ACTIVITY_ENTRIES = 6;

function defaultControls(): DemoControlDefaults {
  const hour = new Date().getHours();
  return {
    calendarView: "infinite-horizontal",
    calendarCount: 6,
    zoom: 1.2,
    snapMinutes: 15,
    startHour: Math.min(8, hour),
    endHour: Math.min(24, Math.max(18, hour + 1)),
    excludeWeekends: false,
    editAvailabilities: false,
    apiLatencyMs: 0,
    jumpDate: "2026-07-04",
    jumpTime: "09:00"
  };
}

export function DefaultDemo({ routes }: { routes: DemoRoute[] }) {
  const controlDefaults = useMemo(defaultControls, []);
  const controls = useDemoControls(controlDefaults, defaultLayout);
  const systemNow = useSystemNow();
  const [scale, setScale] = useState(1_000);
  const [events, setEvents] = useState(() => createDemoEvents(1_000));
  const [eventVersion, setEventVersion] = useState(0);
  const [activityEntries, setActivityEntries] = useState(["Ready"]);
  const eventsRef = useRef(events);
  const selectedCalendarIdsRef = useRef<string[]>([]);
  const isExternalDraftOpenRef = useRef(false);
  const calendarRef = useRef<QunoCalendarHandle>(null);
  const calendarPanelRef = useRef<HTMLElement>(null);
  const setMessage = useCallback((message: string) => {
    setActivityEntries((current) => [...current.slice(-(MAX_ACTIVITY_ENTRIES - 1)), message]);
  }, []);
  useViewportActivityLog({
    containerRef: calendarPanelRef,
    resetKey: `${controls.calendarView}:${scale}`,
    onActivity: setMessage
  });

  const selectedCalendarIds = useMemo(
    () => demoCalendars.slice(0, controls.calendarCount).map((calendar) => calendar.id),
    [controls.calendarCount]
  );
  selectedCalendarIdsRef.current = selectedCalendarIds;

  const loadStoredEvents = useCallback((args: Parameters<ReturnType<typeof createRangeLoader>>[0]) => {
    const calendarIds = isExternalDraftOpenRef.current ? selectedCalendarIdsRef.current : args.calendarIds;
    return createRangeLoader(eventsRef.current)({ ...args, calendarIds });
  }, []);
  const simulatedApi = useSimulatedApiLoader(loadStoredEvents, controls.apiLatencyMs);

  const updateEvents = useCallback((updater: SetStateAction<CalendarEvent[]>) => {
    setEvents((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      eventsRef.current = next;
      return next;
    });
  }, []);

  const drafts = useExternalEventDrafts({
    selectedCalendarIds,
    calendarRef,
    jumpDate: controls.jumpDate,
    jumpTime: controls.jumpTime,
    snapMinutes: controls.snapMinutes,
    editAvailabilities: controls.editAvailabilities,
    setEvents: updateEvents,
    setMessage
  });
  isExternalDraftOpenRef.current = Boolean(drafts.activeDraft);

  const draftSave = useDraftSaveSimulation({
    activeDraft: drafts.activeDraft,
    saveActiveDraft: drafts.saveActiveDraft,
    cancelActiveDraft: drafts.cancelActiveDraft,
    updateDraftEvent: drafts.updateDraftEvent,
    toggleDraftParticipant: drafts.toggleDraftParticipant,
    setMessage
  });
  const resetActiveDraft = drafts.resetActiveDraft;
  const resetSaveFeedback = draftSave.resetSaveFeedback;
  const { jumpDate, jumpTime, setJumpDate, setJumpTime, setEditAvailabilities } = controls;

  const handleScaleChange = useCallback(
    (nextScale: number) => {
      const nextEvents = createDemoEvents(nextScale);
      eventsRef.current = nextEvents;
      setEvents(nextEvents);
      setScale(nextScale);
      setEventVersion((current) => current + 1);
      resetActiveDraft();
      resetSaveFeedback();
      setMessage(`Loaded deterministic ${nextScale.toLocaleString()} events/year dataset`);
    },
    [resetActiveDraft, resetSaveFeedback, setMessage]
  );

  const handleMove = useCallback(
    (request: EventMoveRequest) => {
      if (request.event.title.startsWith("Locked") || request.proposedCalendarId === "blocked-calendar") {
        setMessage("Move rejected by parent validation");
        return false;
      }
      updateEvents((current) => applyMove(current, request));
      setMessage(
        request.event.kind === "availability" ? "Availability move accepted" : "Move accepted by parent validation"
      );
      return true;
    },
    [setMessage, updateEvents]
  );

  const handleCreate = useCallback(
    (request: EventCreateRequest) => {
      updateEvents((current) => appendCreatedEvent(current, request));
      setMessage(
        request.kind === "availability" ? "Created availability from drawn area" : "Created new event from drawn area"
      );
    },
    [setMessage, updateEvents]
  );

  const handleToday = useCallback(() => {
    calendarRef.current?.scrollToToday();
    setJumpDate(dateInputValue(systemNow));
    setJumpTime(timeInputValue(systemNow));
    setMessage("Scrolled to today");
  }, [setJumpDate, setJumpTime, setMessage, systemNow]);

  const handleGoToDate = useCallback(() => {
    calendarRef.current?.scrollToDateTime(jumpDate, jumpTime);
    setMessage(`Scrolled to ${jumpDate} ${jumpTime}`);
  }, [jumpDate, jumpTime, setMessage]);

  const handleAvailabilityModeChange = useCallback(
    (checked: boolean) => {
      setEditAvailabilities(checked);
      setMessage(checked ? "Availability editing enabled" : "Appointment editing enabled");
    },
    [setEditAvailabilities, setMessage]
  );

  return (
    <DemoZoomProvider initialZoom={controlDefaults.zoom}>
      <main className="app-shell" data-demo-id="default">
        <DefaultDemoSidebar
          routes={routes}
          scale={scale}
          activityEntries={activityEntries}
          controls={controls}
          pendingApiRequestCount={simulatedApi.pendingRequestCount}
          onScaleChange={handleScaleChange}
          onAvailabilityModeChange={handleAvailabilityModeChange}
          onToday={handleToday}
          onGoToDate={handleGoToDate}
          onExternalAdd={drafts.handleExternalAdd}
        />
        <section ref={calendarPanelRef} className="demo-calendar-panel">
          {drafts.activeDraft ? (
            <ExternalEventPopup
              activeDraft={drafts.activeDraft}
              canSave={drafts.canSaveActiveDraft}
              isSaving={draftSave.saveState.isSaving}
              saveError={draftSave.saveState.error}
              onCancel={draftSave.handleCancel}
              onSave={draftSave.handleSave}
              onUpdateDraftEvent={draftSave.handleUpdate}
              onToggleParticipant={draftSave.handleParticipantToggle}
            />
          ) : null}
          <DemoQunoCalendar
            key={scale}
            view={controls.calendarView}
            ref={calendarRef}
            calendars={demoCalendars}
            selectedCalendarIds={drafts.visibleCalendarIds}
            loadEvents={simulatedApi.loadEvents}
            eventVersion={eventVersion}
            eventRenderer={DemoEventCard}
            activeDraft={drafts.activeDraft}
            onEventMoveRequest={handleMove}
            onEventCreateRequest={handleCreate}
            onEventDraftRequest={drafts.openCreateDraft}
            onEventActivate={drafts.handleActivate}
            onActiveDraftMoveRequest={drafts.handleActiveDraftMove}
            now={systemNow}
            interactionMode={controls.editAvailabilities ? "availability" : "events"}
            settings={controls.settings}
          />
        </section>
      </main>
    </DemoZoomProvider>
  );
}
