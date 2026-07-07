import { Columns3, CalendarDays } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarRoot, type CalendarNavigationHandle, type EventCreateRequest, type EventMoveRequest } from "../../lib";
import { appendCreatedEvent, applyMove, createDemoEvents, createRangeLoader, demoCalendars } from "../data";
import { Demo2EventCard } from "./Demo2EventCard";
import "./Demo2.css";

type DemoRoute = {
  id: string;
  path: string;
  label: string;
};

type Demo2Props = {
  routes: DemoRoute[];
};

function Demo2RouteNav({ routes }: Demo2Props) {
  return (
    <nav className="demo2-route-nav" aria-label="Demo variants">
      {routes.map((route) => (
        <a aria-current={route.id === "demo2" ? "page" : undefined} data-testid={`demo-route-${route.id}`} href={route.path} key={route.id}>
          {route.label}
        </a>
      ))}
    </nav>
  );
}

export function Demo2({ routes }: Demo2Props) {
  const [scale, setScale] = useState(1_000);
  const [calendarView, setCalendarView] = useState<"infinite-horizontal" | "infinite-vertical">("infinite-vertical");
  const [calendarCount, setCalendarCount] = useState(8);
  const [zoom, setZoom] = useState(2.4);
  const [snapMinutes, setSnapMinutes] = useState(15);
  const [startHour, setStartHour] = useState(7);
  const [endHour, setEndHour] = useState(20);
  const [excludeWeekends, setExcludeWeekends] = useState(false);
  const [editAvailabilities, setEditAvailabilities] = useState(false);
  const [jumpDate, setJumpDate] = useState("2026-07-04");
  const [jumpTime, setJumpTime] = useState("09:00");
  const [events, setEvents] = useState(() => createDemoEvents(1_000));
  const [systemNow, setSystemNow] = useState(() => new Date());
  const [message, setMessage] = useState("Wide vertical resource planner");
  const eventsRef = useRef(events);
  const calendarRef = useRef<CalendarNavigationHandle>(null);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    const interval = window.setInterval(() => setSystemNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const selectedCalendarIds = useMemo(
    () => demoCalendars.slice(0, calendarCount).map((calendar) => calendar.id),
    [calendarCount]
  );

  const loadEvents = useCallback((args: Parameters<ReturnType<typeof createRangeLoader>>[0]) => {
    return createRangeLoader(eventsRef.current)(args);
  }, []);

  const settings = useMemo(
    () => ({
      startHour,
      endHour,
      zoom,
      snapMinutes,
      excludedWeekdays: excludeWeekends ? [0, 6] : [],
      rowHeight: 58,
      dayHeaderHeight: 52,
      labelWidth: 280,
      verticalColumnMinWidth: 280,
      verticalColumnOverlapCapacity: 4,
      verticalColumnOverlapGrowth: 90,
      verticalEventHoverMinHeight: 76
    }),
    [endHour, excludeWeekends, snapMinutes, startHour, zoom]
  );

  const handleScaleChange = (nextScale: number) => {
    setScale(nextScale);
    setEvents(createDemoEvents(nextScale));
    setMessage(`Loaded ${nextScale.toLocaleString()} planner events/year`);
  };

  const handleMove = useCallback((request: EventMoveRequest) => {
    if (request.event.title.startsWith("Locked") || request.proposedCalendarId === "blocked-calendar") {
      setMessage("Move rejected");
      return false;
    }
    setEvents((current) => applyMove(current, request));
    setMessage("Move accepted");
    return true;
  }, []);

  const handleCreate = useCallback((request: EventCreateRequest) => {
    setEvents((current) => appendCreatedEvent(current, request));
    setMessage("Created planner appointment");
  }, []);

  return (
    <main className="demo2-shell" data-demo-id="demo2">
      <aside className="demo2-sidebar" aria-label="Demo controls">
        <div className="demo2-brand">
          <Columns3 size={24} aria-hidden />
          <div>
            <strong>Resource Planner</strong>
            <span>Wide vertical columns</span>
          </div>
        </div>

        <Demo2RouteNav routes={routes} />

        <label>
          Dataset
          <select value={scale} onChange={(event) => handleScaleChange(Number(event.target.value))} data-testid="scale-select">
            {[100, 1_000, 5_000, 20_000].map((value) => (
              <option value={value} key={value}>
                {value.toLocaleString()} / year
              </option>
            ))}
          </select>
        </label>

        <fieldset className="demo2-view-switch" aria-label="Calendar type">
          <legend>Calendar type</legend>
          <label>
            <input
              type="radio"
              name="demo2-view"
              checked={calendarView === "infinite-horizontal"}
              onChange={() => setCalendarView("infinite-horizontal")}
              data-testid="view-infinite-horizontal"
            />
            <span>Infinite Horizontal</span>
          </label>
          <label>
            <input
              type="radio"
              name="demo2-view"
              checked={calendarView === "infinite-vertical"}
              onChange={() => setCalendarView("infinite-vertical")}
              data-testid="view-infinite-vertical"
            />
            <span>Infinite Vertical</span>
          </label>
        </fieldset>

        <label>
          Calendars
          <input data-testid="calendar-count" type="range" min="1" max={demoCalendars.length} value={calendarCount} onChange={(event) => setCalendarCount(Number(event.target.value))} />
          <span>{calendarCount}</span>
        </label>

        <label>
          Zoom
          <div className="demo2-zoom-control">
            <input data-testid="zoom-slider" type="range" min="0.5" max="8" step="0.1" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
            <output data-testid="zoom-value">{zoom.toFixed(2)}</output>
          </div>
        </label>

        <label>
          Snap
          <select value={snapMinutes} onChange={(event) => setSnapMinutes(Number(event.target.value))} data-testid="snap-select">
            {[5, 10, 15, 30].map((value) => (
              <option value={value} key={value}>
                {value} minutes
              </option>
            ))}
          </select>
        </label>

        <div className="demo2-time-range">
          <label>
            Start
            <input type="number" min="0" max="22" value={startHour} onChange={(event) => setStartHour(Number(event.target.value))} />
          </label>
          <label>
            End
            <input type="number" min="1" max="24" value={endHour} onChange={(event) => setEndHour(Number(event.target.value))} />
          </label>
        </div>

        <label className="demo2-toggle">
          <input type="checkbox" checked={excludeWeekends} onChange={(event) => setExcludeWeekends(event.target.checked)} data-testid="exclude-weekends" />
          Exclude weekends
        </label>

        <div className="demo2-date-jump">
          <label>
            Go to date
            <input type="date" value={jumpDate} onChange={(event) => setJumpDate(event.target.value)} data-testid="jump-date-input" />
          </label>
          <label>
            Time
            <input type="time" value={jumpTime} onChange={(event) => setJumpTime(event.target.value)} data-testid="jump-time-input" />
          </label>
          <button
            type="button"
            onClick={() => {
              calendarRef.current?.scrollToDateTime(jumpDate, jumpTime);
              setMessage(`Scrolled to ${jumpDate} ${jumpTime}`);
            }}
            data-testid="go-date-button"
          >
            <CalendarDays size={15} aria-hidden />
            Go
          </button>
        </div>

        <label className="demo2-toggle">
          <input
            type="checkbox"
            checked={editAvailabilities}
            onChange={(event) => {
              setEditAvailabilities(event.target.checked);
              setMessage(event.target.checked ? "Availability editing enabled" : "Appointment editing enabled");
            }}
            data-testid="availability-mode"
          />
          Availabilities
        </label>

        <p className="demo2-message" data-testid="demo-message">
          {message}
        </p>
      </aside>

      <section className="demo2-calendar-panel">
        <CalendarRoot
          key={scale}
          view={calendarView}
          ref={calendarRef}
          calendars={demoCalendars}
          selectedCalendarIds={selectedCalendarIds}
          loadEvents={loadEvents}
          eventRenderer={Demo2EventCard}
          onEventMoveRequest={handleMove}
          onEventCreateRequest={handleCreate}
          onZoomChange={setZoom}
          now={systemNow}
          interactionMode={editAvailabilities ? "availability" : "events"}
          settings={settings}
        />
      </section>
    </main>
  );
}
