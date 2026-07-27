import {
  CalendarRoot,
  applyEventMove,
  type CalendarEvent,
  type CalendarNavigationHandle,
  type EventCreateRequest,
  type EventMoveRequest,
  type LoadEvents,
  type TimelineSettings
} from "quno-calendar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDemoShell } from "./ArticleDemos";
import {
  ArticleEventCard,
  articleCalendars,
  articleDateKey,
  articleEvents,
  articleSettings,
  filterEvents,
  overlapEvents
} from "./articleSupport";

const articleNow = new Date("2026-07-06T13:30:00");
const articleNowTime = "13:30";
const navigationEvents: CalendarEvent[] = [
  ...articleEvents,
  {
    id: "navigation-wednesday",
    calendarId: "provider-a",
    title: "Wednesday procedure",
    subtitle: "Reached by product navigation",
    start: "2026-07-08T15:00:00",
    end: "2026-07-08T16:00:00",
    color: "#246b5d",
    kind: "appointment"
  },
  {
    id: "navigation-friday",
    calendarId: "room-1",
    title: "Friday room review",
    subtitle: "A second direct destination",
    start: "2026-07-10T10:00:00",
    end: "2026-07-10T11:15:00",
    color: "#c77b45",
    kind: "consultation"
  }
];
const loadNavigationEvents: LoadEvents = async (request) => filterEvents(navigationEvents, request);

export function CssNativeDemo() {
  return (
    <CalendarDemoShell
      data-testid="article-css-native-demo"
      note="Scroll in both directions; dates and resource names remain browser-positioned"
      tools={
        <>
          <span className="article-toolbar-badge">position: sticky</span>
          <span className="article-toolbar-badge">No synchronized scroll state</span>
        </>
      }
    >
      <div className="article-calendar-frame">
        <CalendarRoot
          ariaLabel="Calendar with CSS-native sticky chrome"
          calendars={articleCalendars}
          eventRenderer={ArticleEventCard}
          initialDateKey={articleDateKey}
          loadEvents={loadNavigationEvents}
          now={articleNow}
          selectedCalendarIds={["provider-a", "room-1", "equipment-1"]}
          settings={{ ...articleSettings, zoom: 2.2 }}
        />
      </div>
    </CalendarDemoShell>
  );
}

export function TimeMarkerDemo() {
  const calendarRef = useRef<CalendarNavigationHandle>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      calendarRef.current?.scrollToDateTime(articleDateKey, articleNowTime);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <CalendarDemoShell
      data-testid="article-time-marker-demo"
      note="Scroll horizontally, then return to the current point in the working day"
      tools={
        <div className="article-time-marker-controls">
          <span className="article-now-badge">Today · 13:30</span>
          <button
            className="article-button article-button--primary"
            onClick={() => calendarRef.current?.scrollToDateTime(articleDateKey, articleNowTime)}
            type="button"
          >
            Keep current time visible
          </button>
        </div>
      }
    >
      <div className="article-calendar-frame">
        <CalendarRoot
          ref={calendarRef}
          ariaLabel="Calendar with visible current-time marker"
          calendars={articleCalendars}
          eventRenderer={ArticleEventCard}
          initialDateKey={articleDateKey}
          loadEvents={loadNavigationEvents}
          now={articleNow}
          selectedCalendarIds={["provider-a", "room-1"]}
          settings={{ ...articleSettings, zoom: 3 }}
        />
      </div>
    </CalendarDemoShell>
  );
}

export function NavigationControlsDemo() {
  const calendarRef = useRef<CalendarNavigationHandle>(null);
  const [date, setDate] = useState(articleDateKey);
  const [time, setTime] = useState(articleNowTime);
  const [status, setStatus] = useState(`Showing ${articleDateKey} at ${articleNowTime}`);

  const navigate = (nextDate: string, nextTime: string) => {
    if (!nextDate || !nextTime) return;
    calendarRef.current?.scrollToDateTime(nextDate, nextTime);
    setStatus(`Showing ${nextDate} at ${nextTime}`);
  };

  const changeDate = (nextDate: string) => {
    setDate(nextDate);
    navigate(nextDate, time);
  };

  const changeTime = (nextTime: string) => {
    setTime(nextTime);
    navigate(date, nextTime);
  };

  const shiftDay = (amount: number) => {
    const nextDate = shiftDateKey(date, amount);
    setDate(nextDate);
    navigate(nextDate, time);
  };

  return (
    <CalendarDemoShell
      data-testid="article-navigation-demo"
      note={status}
      tools={
        <div className="article-navigation-controls">
          <button aria-label="Previous day" onClick={() => shiftDay(-1)} type="button">
            ←
          </button>
          <label>
            <span>Date</span>
            <input
              aria-label="Destination date"
              onChange={(event) => changeDate(event.target.value)}
              type="date"
              value={date}
            />
          </label>
          <label>
            <span>Time</span>
            <input
              aria-label="Destination time"
              onChange={(event) => changeTime(event.target.value)}
              type="time"
              value={time}
            />
          </label>
          <button aria-label="Next day" onClick={() => shiftDay(1)} type="button">
            →
          </button>
          <button
            className="article-button"
            onClick={() => {
              calendarRef.current?.scrollToToday();
              setStatus("Returned to today and its current time");
            }}
            type="button"
          >
            Today
          </button>
        </div>
      }
    >
      <div className="article-calendar-frame">
        <CalendarRoot
          ref={calendarRef}
          ariaLabel="Calendar with product-owned date and time controls"
          calendars={articleCalendars}
          eventRenderer={ArticleEventCard}
          initialDateKey={articleDateKey}
          loadEvents={loadNavigationEvents}
          now={articleNow}
          selectedCalendarIds={["provider-a", "room-1"]}
          settings={{ ...articleSettings, zoom: 1.3 }}
        />
      </div>
    </CalendarDemoShell>
  );
}

type PrecisionLevel = "overview" | "quarter" | "five-minute";

const precisionZoom: Record<PrecisionLevel, number> = {
  overview: 1,
  quarter: 3,
  "five-minute": 6.5
};

const precisionLabel: Record<PrecisionLevel, string> = {
  overview: "Hours + half hours",
  quarter: "Quarter hours",
  "five-minute": "Every 5 minutes"
};

export function ProgressiveTimeRevealDemo() {
  const [level, setLevel] = useState<PrecisionLevel>("overview");
  const zoom = precisionZoom[level];

  return (
    <CalendarDemoShell
      data-testid="article-time-precision-demo"
      note="The DOM stays stable while readable time labels progressively appear"
      tools={
        <div className="article-precision-controls">
          <div className="article-segmented-control" aria-label="Time-label precision">
            {(Object.keys(precisionZoom) as PrecisionLevel[]).map((option) => (
              <button aria-pressed={level === option} key={option} onClick={() => setLevel(option)} type="button">
                {option === "overview" ? "Overview" : option === "quarter" ? "Quarter hour" : "5 minutes"}
              </button>
            ))}
          </div>
          <span className="article-toolbar-badge" data-testid="article-precision-level">
            {precisionLabel[level]}
          </span>
        </div>
      }
    >
      <div className="article-calendar-frame">
        <CalendarRoot
          ariaLabel="Calendar with progressively revealed time precision"
          calendars={articleCalendars}
          eventRenderer={ArticleEventCard}
          initialDateKey={articleDateKey}
          loadEvents={loadNavigationEvents}
          now={articleNow}
          onZoomChange={(nextZoom) => {
            const nextLevel = nextZoom > 6 ? "five-minute" : nextZoom >= 2 ? "quarter" : ("overview" as PrecisionLevel);
            setLevel(nextLevel);
          }}
          selectedCalendarIds={["provider-a", "room-1"]}
          settings={{ ...articleSettings, zoom }}
        />
      </div>
    </CalendarDemoShell>
  );
}

type ArticleTheme = "clinical" | "compact" | "night";

const themeSettings: Record<ArticleTheme, Partial<TimelineSettings>> = {
  clinical: { ...articleSettings, rowHeight: 58, labelWidth: 190, zoom: 1.15 },
  compact: { ...articleSettings, rowHeight: 42, dayHeaderHeight: 36, labelWidth: 150, zoom: 0.95 },
  night: { ...articleSettings, rowHeight: 56, dayHeaderHeight: 46, labelWidth: 180, zoom: 1.2 }
};

export function StylingDemo() {
  const [theme, setTheme] = useState<ArticleTheme>("clinical");

  return (
    <CalendarDemoShell
      data-testid="article-styling-demo"
      note="Settings change information density; a scoped class changes the product expression"
      tools={<ThemeControl onChange={setTheme} theme={theme} />}
    >
      <div className="article-calendar-frame">
        <CalendarRoot
          ariaLabel="Styleable calendar presets"
          calendars={articleCalendars}
          className={`article-themed-calendar theme-${theme}`}
          eventRenderer={ArticleEventCard}
          initialDateKey={articleDateKey}
          key={theme}
          loadEvents={loadNavigationEvents}
          now={articleNow}
          selectedCalendarIds={["provider-a", "room-1", "equipment-1"]}
          settings={themeSettings[theme]}
        />
      </div>
    </CalendarDemoShell>
  );
}

function ThemeControl({ onChange, theme }: { onChange: (theme: ArticleTheme) => void; theme: ArticleTheme }) {
  return (
    <div className="article-segmented-control" aria-label="Calendar style preset">
      {(["clinical", "compact", "night"] as const).map((option) => (
        <button aria-pressed={theme === option} key={option} onClick={() => onChange(option)} type="button">
          {option[0].toUpperCase() + option.slice(1)}
        </button>
      ))}
    </div>
  );
}

function shiftDateKey(dateKey: string, amount: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function EverythingTogetherDemo() {
  const calendarRef = useRef<CalendarNavigationHandle>(null);
  const sequenceRef = useRef(0);
  const eventsRef = useRef<CalendarEvent[]>([...overlapEvents, ...navigationEvents.slice(articleEvents.length)]);
  const [zoom, setZoom] = useState(1.25);
  const [theme, setTheme] = useState<ArticleTheme>("clinical");
  const [status, setStatus] = useState("The complete scheduling surface is ready");
  const loadEvents = useCallback<LoadEvents>(async (request) => filterEvents(eventsRef.current, request), []);
  const settings = useMemo(() => ({ ...themeSettings[theme], zoom }), [theme, zoom]);

  const createEvent = useCallback((request: EventCreateRequest) => {
    sequenceRef.current += 1;
    const event: CalendarEvent = {
      id: `article-summary-created-${sequenceRef.current}`,
      calendarId: request.calendarId,
      title: "New appointment",
      subtitle: "Created by the product",
      start: request.start,
      end: request.end,
      color: "#246b5d",
      kind: "appointment"
    };
    eventsRef.current = [...eventsRef.current, event];
    setStatus("The parent accepted a newly drawn appointment");
    return event;
  }, []);

  const moveEvent = useCallback((request: EventMoveRequest) => {
    eventsRef.current = eventsRef.current.map((event) =>
      event.id === request.event.id ? applyEventMove(event, request) : event
    );
    setStatus(`Moved “${request.event.title}”`);
    return true;
  }, []);

  const insertEvent = () => {
    sequenceRef.current += 1;
    const event: CalendarEvent = {
      id: `article-summary-inserted-${sequenceRef.current}`,
      calendarId: "provider-a",
      title: "Priority consultation",
      subtitle: "Inserted with renderer-owned motion",
      start: `${articleDateKey}T15:30:00`,
      end: `${articleDateKey}T16:30:00`,
      color: "#9b6a9e",
      kind: "consultation"
    };
    eventsRef.current = [
      ...eventsRef.current.filter((candidate) => !candidate.id.startsWith("article-summary-inserted-")),
      event
    ];
    calendarRef.current?.commitVisibleEvent(event, { appearing: true });
    calendarRef.current?.scrollToDateTime(articleDateKey, "15:30");
    setStatus("Inserted an event without rebuilding the calendar");
  };

  return (
    <CalendarDemoShell
      className="article-calendar-demo--summary"
      data-testid="article-summary-demo"
      note={status}
      tools={
        <div className="article-summary-controls">
          <button
            className="article-button"
            onClick={() => {
              calendarRef.current?.scrollToToday();
              setStatus("Current day and time restored");
            }}
            type="button"
          >
            Today
          </button>
          <button className="article-button article-button--primary" onClick={insertEvent} type="button">
            Insert event
          </button>
          <button
            aria-label="Summary zoom out"
            onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}
            type="button"
          >
            −
          </button>
          <output data-testid="article-summary-zoom">{zoom.toFixed(2)}×</output>
          <button
            aria-label="Summary zoom in"
            onClick={() => setZoom((value) => Math.min(4, value + 0.25))}
            type="button"
          >
            +
          </button>
          <select
            aria-label="Summary calendar theme"
            onChange={(event) => setTheme(event.target.value as ArticleTheme)}
            value={theme}
          >
            <option value="clinical">Clinical</option>
            <option value="compact">Compact</option>
            <option value="night">Night</option>
          </select>
        </div>
      }
    >
      <div className="article-calendar-frame">
        <CalendarRoot
          ref={calendarRef}
          ariaLabel="Complete calendar system example"
          calendars={articleCalendars}
          className={`article-themed-calendar theme-${theme}`}
          eventRenderer={ArticleEventCard}
          initialDateKey={articleDateKey}
          loadEvents={loadEvents}
          now={articleNow}
          onEventCreateRequest={createEvent}
          onEventMoveRequest={moveEvent}
          onZoomChange={setZoom}
          selectedCalendarIds={["provider-a", "room-1", "equipment-1"]}
          settings={settings}
        />
      </div>
    </CalendarDemoShell>
  );
}
