import { useCallback, useMemo, useRef, useState } from "react";
import type { IsoDate } from "@quno/calendar";
import type {
  QunoInfiniteCalendarHandle,
  EventCreateRequest,
  EventMoveRequest
} from "@quno/calendar/infinite-calendar";
import { createDemoEvent, applyMove, demoCalendars } from "#quno-demo/showcase/data";
import { useDemoControls } from "#quno-demo/showcase/hooks/useDemoControls";
import { useSimulatedApiLoader } from "#quno-demo/showcase/hooks/useSimulatedApiLoader";
import { useSystemNow } from "#quno-demo/showcase/hooks/useSystemNow";
import type { DemoPreset } from "./types";

export function usePresetDemo(preset: DemoPreset) {
  const [scale, setScale] = useState(preset.initialScale);
  const [message, setMessage] = useState(preset.messages.initial);
  const calendarRef = useRef<QunoInfiniteCalendarHandle>(null);
  const controls = useDemoControls(preset.controls, preset.layout);
  const systemNow = useSystemNow();
  const { setJumpDate, setEditAvailabilities } = controls;

  const selectedCalendarIds = useMemo(
    () => demoCalendars.slice(0, controls.calendarCount).map((calendar) => calendar.id),
    [controls.calendarCount]
  );

  const simulatedApi = useSimulatedApiLoader({ eventsPerYear: scale, latencyMs: controls.apiLatencyMs });
  const { setEvents: updateEvents, resetEvents } = simulatedApi;

  const handleScaleChange = useCallback(
    (nextScale: number) => {
      resetEvents();
      setScale(nextScale);
      setMessage(preset.messages.datasetLoaded(nextScale));
    },
    [preset.messages, resetEvents]
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
      const created = createDemoEvent(request);
      updateEvents((current) => [...current, created]);
      setMessage(preset.messages.eventCreated(request));
      return created;
    },
    [preset.messages, updateEvents]
  );

  const goToDate = useCallback(
    (date: IsoDate) => {
      setJumpDate(date);
      calendarRef.current?.scrollToDate({ date });
      setMessage(`Scrolled to ${date}`);
    },
    [setJumpDate]
  );

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
