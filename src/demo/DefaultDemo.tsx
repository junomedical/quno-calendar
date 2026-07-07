import { CalendarDays, LocateFixed } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarRoot, type CalendarNavigationHandle, type EventCreateRequest, type EventMoveRequest } from "../lib";
import { appendCreatedEvent, applyMove, createDemoEvents, createRangeLoader, demoCalendars } from "./data";
import { DemoEventCard } from "./DemoEventCard";

const scales = [100, 1_000, 5_000, 20_000];

type DemoRoute = {
  id: string;
  path: string;
  label: string;
};

type DefaultDemoProps = {
  routes: DemoRoute[];
};

type DemoStats = {
  frameMs: number;
  visibleEventNodes: number;
  totalCalendarNodes: number;
};

function initialTimelineBounds() {
  const hour = new Date().getHours();
  return {
    startHour: Math.min(8, hour),
    endHour: Math.min(24, Math.max(18, hour + 1))
  };
}

function timeInputValue(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function dateInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function countVisibleEventNodes() {
  const viewport = document.querySelector(".ic-viewport")?.getBoundingClientRect();
  if (!viewport) {
    return 0;
  }

  return Array.from(
    document.querySelectorAll<HTMLElement>('[data-testid="calendar-event"], [data-testid="availability-event"], [data-testid="draft-event"]')
  ).filter((element) => {
    const box = element.getBoundingClientRect();
    return (
      box.width > 0 &&
      box.height > 0 &&
      box.right > viewport.left &&
      box.left < viewport.right &&
      box.bottom > viewport.top &&
      box.top < viewport.bottom
    );
  }).length;
}

function countTotalCalendarNodes() {
  const shell = document.querySelector(".ic-shell");
  return shell ? shell.querySelectorAll("*").length + 1 : 0;
}

function DemoStatsPanel() {
  const [stats, setStats] = useState<DemoStats>({ frameMs: 0, visibleEventNodes: 0, totalCalendarNodes: 0 });

  useEffect(() => {
    let animationFrame = 0;
    let previousFrameTime = performance.now();
    let previousStatsUpdate = previousFrameTime;
    const frameSamples: number[] = [];

    const sample = (frameTime: number) => {
      const frameMs = frameTime - previousFrameTime;
      previousFrameTime = frameTime;
      if (frameMs > 0 && frameMs < 250) {
        frameSamples.push(frameMs);
        if (frameSamples.length > 20) {
          frameSamples.shift();
        }
      }

      if (frameTime - previousStatsUpdate >= 500) {
        previousStatsUpdate = frameTime;
        const averageFrameMs =
          frameSamples.length === 0 ? 0 : frameSamples.reduce((total, value) => total + value, 0) / frameSamples.length;
        setStats({
          frameMs: Number(averageFrameMs.toFixed(1)),
          visibleEventNodes: countVisibleEventNodes(),
          totalCalendarNodes: countTotalCalendarNodes()
        });
      }

      animationFrame = window.requestAnimationFrame(sample);
    };

    animationFrame = window.requestAnimationFrame(sample);
    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <dl className="demo-stats" aria-label="Calendar rendering stats">
      <div>
        <dt>Redraw frame</dt>
        <dd data-testid="stat-frame-ms">{stats.frameMs.toFixed(1)} ms</dd>
      </div>
      <div>
        <dt>Visible event nodes</dt>
        <dd data-testid="stat-visible-events">{stats.visibleEventNodes.toLocaleString()}</dd>
      </div>
      <div>
        <dt>Total calendar nodes</dt>
        <dd data-testid="stat-total-calendar-nodes">{stats.totalCalendarNodes.toLocaleString()}</dd>
      </div>
    </dl>
  );
}

function DemoRouteNav({ routes }: DefaultDemoProps) {
  return (
    <nav className="demo-route-nav" aria-label="Demo variants">
      {routes.map((route) => (
        <a aria-current={route.id === "default" ? "page" : undefined} data-testid={`demo-route-${route.id}`} href={route.path} key={route.id}>
          {route.label}
        </a>
      ))}
    </nav>
  );
}

export function DefaultDemo({ routes }: DefaultDemoProps) {
  const initialBounds = useMemo(() => initialTimelineBounds(), []);
  const [scale, setScale] = useState(1_000);
  const [calendarView, setCalendarView] = useState<"infinite-horizontal" | "infinite-vertical">("infinite-horizontal");
  const [calendarCount, setCalendarCount] = useState(6);
  const [zoom, setZoom] = useState(1.2);
  const [snapMinutes, setSnapMinutes] = useState(15);
  const [startHour, setStartHour] = useState(initialBounds.startHour);
  const [endHour, setEndHour] = useState(initialBounds.endHour);
  const [excludeWeekends, setExcludeWeekends] = useState(false);
  const [editAvailabilities, setEditAvailabilities] = useState(false);
  const [jumpDate, setJumpDate] = useState("2026-07-04");
  const [jumpTime, setJumpTime] = useState("09:00");
  const [events, setEvents] = useState(() => createDemoEvents(1_000));
  const [systemNow, setSystemNow] = useState(() => new Date());
  const eventsRef = useRef(events);
  const [message, setMessage] = useState("Ready");
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

  const calendarSettings = useMemo(
    () => ({
      startHour,
      endHour,
      zoom,
      snapMinutes,
      excludedWeekdays: excludeWeekends ? [0, 6] : [],
      rowHeight: 50,
      dayHeaderHeight: 42,
      labelWidth: 230,
      verticalColumnMinWidth: 240,
      verticalColumnOverlapCapacity: 3,
      verticalColumnOverlapGrowth: 80,
      verticalEventHoverMinHeight: 64
    }),
    [endHour, excludeWeekends, snapMinutes, startHour, zoom]
  );

  const handleScaleChange = (nextScale: number) => {
    setScale(nextScale);
    setEvents(createDemoEvents(nextScale));
    setMessage(`Loaded deterministic ${nextScale.toLocaleString()} events/year dataset`);
  };

  const handleMove = useCallback((request: EventMoveRequest) => {
    if (request.event.title.startsWith("Locked") || request.proposedCalendarId === "blocked-calendar") {
      setMessage("Move rejected by parent validation");
      return false;
    }
    setEvents((current) => applyMove(current, request));
    setMessage(request.event.kind === "availability" ? "Availability move accepted" : "Move accepted by parent validation");
    return true;
  }, []);

  const handleCreate = useCallback((request: EventCreateRequest) => {
    setEvents((current) => appendCreatedEvent(current, request));
    setMessage(request.kind === "availability" ? "Created availability from drawn area" : "Created new event from drawn area");
  }, []);

  return (
    <main className="app-shell" data-demo-id="default">
      <aside className="demo-sidebar" aria-label="Demo controls">
        <div className="demo-brand">
          <CalendarDays size={26} aria-hidden />
          <div>
            <strong>Infinite Calendar</strong>
            <span>Reusable React PoC</span>
          </div>
        </div>

        <DemoRouteNav routes={routes} />

        <label>
          Dataset
          <select value={scale} onChange={(event) => handleScaleChange(Number(event.target.value))} data-testid="scale-select">
            {scales.map((value) => (
              <option value={value} key={value}>
                {value.toLocaleString()} / year
              </option>
            ))}
          </select>
        </label>

        <fieldset className="view-switch" aria-label="Calendar type">
          <legend>Calendar type</legend>
          <label>
            <input
              type="radio"
              name="calendar-view"
              value="infinite-horizontal"
              checked={calendarView === "infinite-horizontal"}
              onChange={() => setCalendarView("infinite-horizontal")}
              data-testid="view-infinite-horizontal"
            />
            <span>Infinite Horizontal</span>
          </label>
          <label>
            <input
              type="radio"
              name="calendar-view"
              value="infinite-vertical"
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
          <div className="zoom-control">
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

        <div className="time-range">
          <label>
            Start
            <input type="number" min="0" max="22" value={startHour} onChange={(event) => setStartHour(Number(event.target.value))} />
          </label>
          <label>
            End
            <input type="number" min="1" max="24" value={endHour} onChange={(event) => setEndHour(Number(event.target.value))} />
          </label>
        </div>

        <label className="toggle">
          <input type="checkbox" checked={excludeWeekends} onChange={(event) => setExcludeWeekends(event.target.checked)} data-testid="exclude-weekends" />
          Exclude weekends
        </label>

        <label className="toggle">
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

        <div className="date-jump">
          <label className="date-jump-date">
            Go to date
            <input type="date" value={jumpDate} onChange={(event) => setJumpDate(event.target.value)} data-testid="jump-date-input" />
          </label>
          <label className="date-jump-time">
            Time
            <input type="time" value={jumpTime} onChange={(event) => setJumpTime(event.target.value)} data-testid="jump-time-input" />
          </label>
          <div className="date-jump-actions">
            <button
              type="button"
              onClick={() => {
                calendarRef.current?.scrollToToday();
                setJumpDate(dateInputValue(systemNow));
                setJumpTime(timeInputValue(systemNow));
                setMessage("Scrolled to today");
              }}
              data-testid="today-button"
            >
              <LocateFixed size={15} aria-hidden />
              Today
            </button>
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
        </div>

        <p className="demo-message" data-testid="demo-message">
          {message}
        </p>

        <DemoStatsPanel />
      </aside>

      <section className="demo-calendar-panel">
        <CalendarRoot
          key={scale}
          view={calendarView}
          ref={calendarRef}
          calendars={demoCalendars}
          selectedCalendarIds={selectedCalendarIds}
          loadEvents={loadEvents}
          eventRenderer={DemoEventCard}
          onEventMoveRequest={handleMove}
          onEventCreateRequest={handleCreate}
          onZoomChange={setZoom}
          now={systemNow}
          interactionMode={editAvailabilities ? "availability" : "events"}
          settings={calendarSettings}
        />
      </section>
    </main>
  );
}
