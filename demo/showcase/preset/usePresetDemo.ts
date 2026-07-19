import { useCallback, useMemo, useRef, useState, type SetStateAction } from "react";
import type { CalendarEvent, CalendarNavigationHandle, EventCreateRequest, EventMoveRequest } from "quno-calendar";
import { appendCreatedEvent, applyMove, createDemoEvents, createRangeLoader, demoCalendars } from "../data";
import { useDemoControls } from "../hooks/useDemoControls";
import { useSimulatedApiLoader } from "../hooks/useSimulatedApiLoader";
import { useSystemNow } from "../hooks/useSystemNow";
import type { DemoPreset } from "./types";

export function usePresetDemo(preset: DemoPreset) {
  const [scale, setScale] = useState(preset.initialScale);
  const [events, setEvents] = useState(() => createDemoEvents(preset.initialScale));
  const [message, setMessage] = useState(preset.messages.initial);
  const eventsRef = useRef(events);
  const calendarRef = useRef<CalendarNavigationHandle>(null);
  const controls = useDemoControls(preset.controls, preset.layout);
  const systemNow = useSystemNow();
  const { jumpDate, jumpTime, setEditAvailabilities } = controls;

  const selectedCalendarIds = useMemo(
    () => demoCalendars.slice(0, controls.calendarCount).map((calendar) => calendar.id),
    [controls.calendarCount]
  );

  const loadStoredEvents = useCallback((args: Parameters<ReturnType<typeof createRangeLoader>>[0]) => {
    return createRangeLoader(eventsRef.current)(args);
  }, []);
  const simulatedApi = useSimulatedApiLoader(loadStoredEvents, controls.apiLatencyMs);

  const updateEvents = useCallback((updater: SetStateAction<CalendarEvent[]>) => {
    setEvents((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      eventsRef.current = next;
      return next;
    });
  }, []);

  const handleScaleChange = useCallback(
    (nextScale: number) => {
      const nextEvents = createDemoEvents(nextScale);
      eventsRef.current = nextEvents;
      setEvents(nextEvents);
      setScale(nextScale);
      setMessage(preset.messages.datasetLoaded(nextScale));
    },
    [preset.messages]
  );

  const handleMove = useCallback(
    (request: EventMoveRequest) => {
      if (request.event.title.startsWith("Locked") || request.proposedCalendarId === "blocked-calendar") {
        setMessage(preset.messages.moveRejected);
        return false;
      }
      updateEvents((current) => applyMove(current, request));
      setMessage(preset.messages.moveAccepted(request));
      return true;
    },
    [preset.messages, updateEvents]
  );

  const handleCreate = useCallback(
    (request: EventCreateRequest) => {
      updateEvents((current) => appendCreatedEvent(current, request));
      setMessage(preset.messages.eventCreated(request));
    },
    [preset.messages, updateEvents]
  );

  const goToDate = useCallback(() => {
    calendarRef.current?.scrollToDateTime(jumpDate, jumpTime);
    setMessage(`Scrolled to ${jumpDate} ${jumpTime}`);
  }, [jumpDate, jumpTime]);

  const setAvailabilityMode = useCallback(
    (checked: boolean) => {
      setEditAvailabilities(checked);
      setMessage(checked ? "Availability editing enabled" : "Appointment editing enabled");
    },
    [setEditAvailabilities]
  );

  return {
    scale,
    message,
    controls,
    calendarRef,
    selectedCalendarIds,
    systemNow,
    loadEvents: simulatedApi.loadEvents,
    pendingApiRequestCount: simulatedApi.pendingRequestCount,
    handleScaleChange,
    handleMove,
    handleCreate,
    goToDate,
    setAvailabilityMode
  };
}
