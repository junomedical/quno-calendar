import { useCallback, useMemo, useRef, useState } from "react";
import {
  type QunoInfiniteCalendarHandle,
  type EventCreateRequest,
  type EventMoveRequest
} from "@quno/calendar/infinite-calendar";
import { demoCalendars, createDemoEvent, applyMove } from "./data";
import { DemoEventCard } from "./DemoEventCard";
import { DefaultDemoSidebar } from "./default/DefaultDemoSidebar";
import { useDraftSaveSimulation } from "./default/useDraftSaveSimulation";
import { dateInputValue } from "./draftFormUtils";
import { ExternalEventPopup } from "./ExternalEventPopup";
import {
  useDemoControls,
  type DemoControlDefaults,
  type DemoControls,
  type DemoLayoutSettings
} from "./hooks/useDemoControls";
import { useSimulatedApiLoader } from "./hooks/useSimulatedApiLoader";
import { useSystemNow } from "./hooks/useSystemNow";
import { useViewportActivityLog } from "./hooks/useViewportActivityLog";
import { useExternalEventDrafts } from "./useExternalEventDrafts";
import { DemoQunoInfiniteCalendar, DemoZoomProvider } from "./zoom/DemoZoom";

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
    jumpDate: "2026-07-04"
  };
}

export function DefaultDemo() {
  const controlDefaults = useMemo(defaultControls, []);
  const controls = useDemoControls(controlDefaults, defaultLayout);
  const systemNow = useSystemNow();
  const [scale, setScale] = useState(1_000);
  const [eventVersion, setEventVersion] = useState(0);
  const [activityEntries, setActivityEntries] = useState(["Ready"]);
  const calendarRef = useRef<QunoInfiniteCalendarHandle>(null);
  const calendarPanelRef = useRef<HTMLElement>(null);
  const setMessage = useCallback((message: string) => {
    setActivityEntries((current) => [...current.slice(-(MAX_ACTIVITY_ENTRIES - 1)), message]);
  }, []);
  const markProgrammaticReposition = useViewportActivityLog({
    containerRef: calendarPanelRef,
    resetKey: `${controls.calendarView}:${scale}`,
    onActivity: setMessage
  });

  const selectedCalendarIds = useMemo(
    () => demoCalendars.slice(0, controls.calendarCount).map((calendar) => calendar.id),
    [controls.calendarCount]
  );
  const simulatedApi = useSimulatedApiLoader({ eventsPerYear: scale, latencyMs: controls.apiLatencyMs });
  const { setEvents: updateEvents, resetEvents } = simulatedApi;

  const drafts = useExternalEventDrafts({
    selectedCalendarIds,
    view: controls.calendarView,
    calendarRef,
    setEvents: updateEvents,
    setMessage
  });

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
  const { setJumpDate, setEditAvailabilities } = controls;

  const handleScaleChange = useCallback(
    (nextScale: number) => {
      resetEvents();
      setScale(nextScale);
      setEventVersion((current) => current + 1);
      resetActiveDraft();
      resetSaveFeedback();
      setMessage(`Loaded deterministic ${nextScale.toLocaleString()} events/year dataset`);
    },
    [resetActiveDraft, resetEvents, resetSaveFeedback, setMessage]
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
      const created = createDemoEvent(request);
      updateEvents((current) => [...current, created]);
      setMessage(
        request.kind === "availability" ? "Created availability from drawn area" : "Created new event from drawn area"
      );
      return created;
    },
    [setMessage, updateEvents]
  );

  const handleToday = useCallback(() => {
    markProgrammaticReposition();
    calendarRef.current?.scrollToToday();
    setJumpDate(dateInputValue(systemNow));
    setMessage("Scrolled to today");
  }, [markProgrammaticReposition, setJumpDate, setMessage, systemNow]);

  const handleGoToDate = useCallback(
    (date: DemoControls["jumpDate"]) => {
      setJumpDate(date);
      markProgrammaticReposition();
      calendarRef.current?.scrollToDateTime({ date, time: "09:00" });
      setMessage(`Scrolled to ${date}`);
    },
    [markProgrammaticReposition, setJumpDate, setMessage]
  );

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
          scale={scale}
          activityEntries={activityEntries}
          controls={controls}
          pendingApiRequestCount={simulatedApi.pendingRequestCount}
          onScaleChange={handleScaleChange}
          onAvailabilityModeChange={handleAvailabilityModeChange}
          onToday={handleToday}
          onGoToDate={handleGoToDate}
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
          <DemoQunoInfiniteCalendar
            key={scale}
            view={controls.calendarView}
            ref={calendarRef}
            calendars={demoCalendars}
            selectedCalendarIds={drafts.visibleCalendarIds}
            loadCalendarIds={selectedCalendarIds}
            loadEvents={simulatedApi.loadEvents}
            eventVersion={eventVersion}
            renderEvent={DemoEventCard}
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
