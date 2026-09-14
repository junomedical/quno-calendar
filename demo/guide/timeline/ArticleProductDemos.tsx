import type { DateRange, IsoDate } from "@quno/calendar";
import { QunoDateInput } from "@quno/calendar/date-input";
import { parseDateInput } from "@quno/calendar/date-parser";
import {
  QunoInfiniteCalendar,
  applyEventMove,
  type CalendarEvent,
  type QunoInfiniteCalendarHandle,
  type QunoInfiniteCalendarCellCustomizer,
  type QunoInfiniteCalendarDayCustomizer,
  type QunoInfiniteCalendarHourCustomizer,
  type QunoInfiniteCalendarFormatters,
  type EventCreateRequest,
  type EventMoveRequest,
  type EventRendererProps,
  type LoadEvents,
  type QunoInfiniteCalendarSettings
} from "@quno/calendar/infinite-calendar";
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
const navigationExpectedRange: DateRange = {
  start: "2025-01-01",
  end: "2027-12-31"
};

type CardGrouping = "product" | "patient" | "room";
type StructuredArticleEvent = CalendarEvent & {
  patientName: string;
  productGroup: string;
  roomNumber: string;
};

const structuredCardEvents: StructuredArticleEvent[] = [
  {
    id: "structured-iv-drip",
    calendarId: "provider-a",
    title: "IV Drip",
    subtitle: "Maya Green · Room 2",
    patientName: "Maya Green",
    productGroup: "IV Drip",
    roomNumber: "Room 2",
    start: `${articleDateKey}T09:00:00`,
    end: `${articleDateKey}T10:30:00`,
    color: "#246b5d",
    kind: "appointment"
  },
  {
    id: "structured-botox",
    calendarId: "provider-a",
    title: "Botox",
    subtitle: "Noah Schneider · Room 4",
    patientName: "Noah Schneider",
    productGroup: "Botox",
    roomNumber: "Room 4",
    start: `${articleDateKey}T10:45:00`,
    end: `${articleDateKey}T12:15:00`,
    color: "#c77b45",
    kind: "appointment"
  },
  {
    id: "structured-sculptra",
    calendarId: "provider-a",
    title: "Sculptra",
    subtitle: "Ava Miller · Room 6",
    patientName: "Ava Miller",
    productGroup: "Sculptra",
    roomNumber: "Room 6",
    start: `${articleDateKey}T12:30:00`,
    end: `${articleDateKey}T14:00:00`,
    color: "#6372a7",
    kind: "appointment"
  },
  {
    id: "structured-skin-treatment",
    calendarId: "provider-a",
    title: "Skin treatment",
    subtitle: "Lina Hoffmann · Room 3",
    patientName: "Lina Hoffmann",
    productGroup: "Skin treatment",
    roomNumber: "Room 3",
    start: `${articleDateKey}T14:15:00`,
    end: `${articleDateKey}T16:00:00`,
    color: "#9b6a9e",
    kind: "appointment"
  }
];
const loadStructuredCardEvents: LoadEvents = async (request) => filterEvents(structuredCardEvents, request);
const cardGroupingLabels: Record<CardGrouping, string> = {
  product: "Product group",
  patient: "Patient name",
  room: "Room number"
};

export function CustomCardStructureDemo() {
  const [grouping, setGrouping] = useState<CardGrouping>("product");
  const renderEvent = useCallback(
    (props: EventRendererProps) => <StructuredEventCard {...props} grouping={grouping} />,
    [grouping]
  );

  return (
    <CalendarDemoShell
      data-testid="article-card-structure-demo"
      note="The calendar keeps the same event geometry while the product renderer changes its information hierarchy"
      tools={
        <div className="article-card-structure-controls">
          <span className="article-toolbar-badge" data-testid="article-card-grouping">
            Grouped by {grouping}
          </span>
          <div className="article-segmented-control" aria-label="Card primary field">
            {(Object.keys(cardGroupingLabels) as CardGrouping[]).map((option) => (
              <button aria-pressed={grouping === option} key={option} onClick={() => setGrouping(option)} type="button">
                {cardGroupingLabels[option]}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div className="article-calendar-frame">
        <QunoInfiniteCalendar
          ariaLabel="Calendar with switchable product card structure"
          calendars={articleCalendars}
          className="article-card-structure-calendar"
          renderEvent={renderEvent}
          initialDateKey={articleDateKey}
          loadEvents={loadStructuredCardEvents}
          selectedCalendarIds={["provider-a"]}
          settings={{
            ...articleSettings,
            startHour: 8,
            endHour: 17,
            rowHeight: 72,
            zoom: 1.4
          }}
        />
      </div>
    </CalendarDemoShell>
  );
}

function StructuredEventCard({ event, grouping, status, style }: EventRendererProps & { grouping: CardGrouping }) {
  const structuredEvent = event as StructuredArticleEvent;
  const values: Record<CardGrouping, string> = {
    product: structuredEvent.productGroup,
    patient: structuredEvent.patientName,
    room: structuredEvent.roomNumber
  };
  const supportingValues = (Object.keys(values) as CardGrouping[])
    .filter((field) => field !== grouping)
    .map((field) => values[field]);

  return (
    <article
      className={`article-structured-event-card status-${status}`}
      data-card-primary={grouping}
      data-primary-value={values[grouping]}
      style={style}
    >
      <span className="article-structured-event-card__kicker">{cardGroupingLabels[grouping]}</span>
      <strong>{values[grouping]}</strong>
      <span className="article-structured-event-card__details">{supportingValues.join(" · ")}</span>
      <span className="article-structured-event-card__time">
        {event.start.slice(11, 16)}–{event.end.slice(11, 16)}
      </span>
    </article>
  );
}

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
        <QunoInfiniteCalendar
          ariaLabel="Calendar with CSS-native sticky chrome"
          calendars={articleCalendars}
          renderEvent={ArticleEventCard}
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
  const calendarRef = useRef<QunoInfiniteCalendarHandle>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      calendarRef.current?.scrollToDateTime({ date: articleDateKey, time: articleNowTime });
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
            onClick={() => calendarRef.current?.scrollToDateTime({ date: articleDateKey, time: articleNowTime })}
            type="button"
          >
            Keep current time visible
          </button>
        </div>
      }
    >
      <div className="article-calendar-frame">
        <QunoInfiniteCalendar
          ref={calendarRef}
          ariaLabel="Calendar with visible current-time marker"
          calendars={articleCalendars}
          renderEvent={ArticleEventCard}
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
  const calendarRef = useRef<QunoInfiniteCalendarHandle>(null);
  const [date, setDate] = useState<IsoDate>(articleDateKey);
  const [status, setStatus] = useState(`Showing ${articleDateKey}`);
  const inputValue = useMemo<DateRange>(() => ({ start: date, end: date }), [date]);

  const navigate = (nextDate: IsoDate) => {
    setDate(nextDate);
    calendarRef.current?.scrollToDateTime({ date: nextDate, time: articleNowTime });
    setStatus(`Showing ${nextDate}`);
  };

  const shiftDay = (amount: number) => {
    const nextDate = shiftDateKey(date, amount);
    navigate(nextDate);
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
          <QunoDateInput
            aria-label="Destination date"
            expectedRange={navigationExpectedRange}
            onChange={({ value: next }) => {
              if (next) navigate(next.start);
            }}
            onKeyDown={(event) => {
              if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
              const input = event.currentTarget;
              window.requestAnimationFrame(() => {
                const result = parseDateInput({
                  text: input.value,
                  ...{
                    expectedRange: navigationExpectedRange,
                    selectionMode: "single",
                    referenceDate: date
                  }
                });
                if (result.status === "success") navigate(result.value.start);
              });
            }}
            selectionMode="single"
            value={inputValue}
          />
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
        <QunoInfiniteCalendar
          ref={calendarRef}
          ariaLabel="Calendar with product-owned date controls"
          calendars={articleCalendars}
          renderEvent={ArticleEventCard}
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
          <span className="article-toolbar-badge" data-testid="article-precision-level">
            {precisionLabel[level]}
          </span>
          <div className="article-segmented-control" aria-label="Time-label precision">
            {(Object.keys(precisionZoom) as PrecisionLevel[]).map((option) => (
              <button aria-pressed={level === option} key={option} onClick={() => setLevel(option)} type="button">
                {option === "overview" ? "Overview" : option === "quarter" ? "Quarter hour" : "5 minutes"}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div className="article-calendar-frame">
        <QunoInfiniteCalendar
          ariaLabel="Calendar with progressively revealed time precision"
          calendars={articleCalendars}
          renderEvent={ArticleEventCard}
          initialDateKey={articleDateKey}
          loadEvents={loadNavigationEvents}
          now={articleNow}
          onZoomChange={({ zoom: nextZoom }) => {
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

const themeSettings: Record<ArticleTheme, Partial<QunoInfiniteCalendarSettings>> = {
  clinical: { ...articleSettings, rowHeight: 58, labelWidth: 190, zoom: 1.15 },
  compact: {
    ...articleSettings,
    rowHeight: 42,
    dayHeaderHeight: 36,
    labelWidth: 150,
    zoom: 0.95
  },
  night: {
    ...articleSettings,
    rowHeight: 56,
    dayHeaderHeight: 46,
    labelWidth: 180,
    zoom: 1.2
  }
};

export function ThemeDemo() {
  const [theme, setTheme] = useState<ArticleTheme>("clinical");

  return (
    <CalendarDemoShell
      data-testid="article-styling-demo"
      note="Settings change information density; a scoped class changes the product expression"
      tools={<ThemeControl onChange={setTheme} theme={theme} />}
    >
      <div className="article-calendar-frame">
        <QunoInfiniteCalendar
          ariaLabel="Calendar theme presets"
          calendars={articleCalendars}
          className={`article-themed-calendar theme-${theme}`}
          renderEvent={ArticleEventCard}
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

export function CalendarCellStylingDemo() {
  const [view, setView] = useState<"infinite-horizontal" | "infinite-vertical">("infinite-horizontal");
  const getDayProps = useCallback<QunoInfiniteCalendarDayCustomizer>(({ isWeekend }) => {
    if (!isWeekend) return undefined;
    return {
      className: "article-weekend-day",
      style: { backgroundColor: "#fff3e3" },
      title: "Weekend"
    };
  }, []);
  const getDayCellProps = useCallback<QunoInfiniteCalendarCellCustomizer>(({ calendar }) => {
    const isEquipment = calendar.id.startsWith("equipment");
    if (!isEquipment) return undefined;
    return {
      className: "article-equipment-cell",
      style: { backgroundColor: "#e8f1ff" },
      title: `${calendar.name} equipment`
    };
  }, []);
  const getHourProps = useCallback<QunoInfiniteCalendarHourCustomizer>(({ hour }) => {
    if (hour !== 12) return undefined;
    return {
      className: "article-lunch-hour",
      style: { backgroundColor: "#dff5e8" },
      title: "Lunch hour"
    };
  }, []);

  return (
    <CalendarDemoShell
      data-testid="article-cell-styling-demo"
      note="Presentation follows each date and resource while calendar geometry remains owned by the component"
      tools={
        <select
          aria-label="Calendar styling orientation"
          className="article-cell-styling-select"
          onChange={(event) => setView(event.target.value as typeof view)}
          value={view}
        >
          <option value="infinite-horizontal">Rows</option>
          <option value="infinite-vertical">Columns</option>
        </select>
      }
    >
      <div className="article-calendar-frame">
        <QunoInfiniteCalendar
          ariaLabel="Calendar cell styling"
          calendars={articleCalendars}
          renderEvent={ArticleEventCard}
          getDayCellProps={getDayCellProps}
          getDayProps={getDayProps}
          getHourProps={getHourProps}
          initialDateKey="2026-07-04"
          key={view}
          loadEvents={loadNavigationEvents}
          now={articleNow}
          selectedCalendarIds={["provider-a", "room-1", "equipment-1"]}
          settings={articleSettings}
          view={view}
        />
      </div>
    </CalendarDemoShell>
  );
}

type DateLabelMode = "english" | "japanese" | "human" | "robot";

const articleReferenceDate = new Date("2026-07-06T12:00:00");
const englishWeekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long"
});
const dayMonthFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short"
});

const humanDayName: QunoInfiniteCalendarFormatters["dayLabel"] = ({ date: isoDate }) => {
  const date = new Date(`${isoDate}T00:00:00`);
  const distance = localCalendarDayNumber(date) - localCalendarDayNumber(articleReferenceDate);
  if (distance === -1) return "Yesterday";
  if (distance === 0) return "Today";
  if (distance === 1) return "Tomorrow";

  const weekStart = (value: Date) => localCalendarDayNumber(value) - ((value.getDay() + 6) % 7);
  if (weekStart(date) === weekStart(articleReferenceDate)) return englishWeekdayFormatter.format(date);
  return dayMonthFormatter.format(date);
};

const robotDayName: QunoInfiniteCalendarFormatters["dayLabel"] = ({ date: isoDate }) => {
  const date = new Date(`${isoDate}T00:00:00`);
  const sequence = ((localCalendarDayNumber(date) % 64) + 64) % 64;
  return sequence.toString(2).padStart(6, "0");
};

const dateLabelOptions: Array<{
  id: DateLabelMode;
  label: string;
  locale: string;
  sample: string;
  sampleLanguage: string;
  dayLabel?: QunoInfiniteCalendarFormatters["dayLabel"];
}> = [
  {
    id: "english",
    label: "English",
    locale: "en-US",
    sample: "July 6th, Monday",
    sampleLanguage: "en"
  },
  {
    id: "japanese",
    label: "日本語",
    locale: "ja-JP",
    sample: "7月6日, 月曜日",
    sampleLanguage: "ja"
  },
  {
    id: "human",
    label: "Human",
    locale: "en-US",
    sample: "Yesterday · Today · Tomorrow",
    sampleLanguage: "en",
    dayLabel: humanDayName
  },
  {
    id: "robot",
    label: "Robot",
    locale: "en-US",
    sample: "011111 · 100000 · 100001",
    sampleLanguage: "en",
    dayLabel: robotDayName
  }
];

export function DateLocalizationDemo() {
  const [mode, setMode] = useState<DateLabelMode>("english");
  const [view, setView] = useState<"infinite-horizontal" | "infinite-vertical">("infinite-horizontal");
  const activeOption = dateLabelOptions.find((option) => option.id === mode) ?? dateLabelOptions[0];
  const settings = useMemo(
    () => ({
      ...articleSettings,
      labelWidth: 205,
      zoom: 1.1
    }),
    []
  );

  return (
    <CalendarDemoShell
      className="article-calendar-demo--localization"
      data-testid="article-date-localization-demo"
      note="Localized, human-relative, and machine labels over one date model"
      tools={
        <div className="article-localization-tools">
          <div className="article-segmented-control article-localization-controls" aria-label="Date label strategy">
            {dateLabelOptions.map((option) => (
              <button
                aria-pressed={mode === option.id}
                key={option.id}
                onClick={() => setMode(option.id)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
          <select
            aria-label="Date label orientation"
            onChange={(event) => setView(event.target.value as typeof view)}
            value={view}
          >
            <option value="infinite-horizontal">Horizontal</option>
            <option value="infinite-vertical">Vertical</option>
          </select>
        </div>
      }
    >
      <div className="article-language-specimens" aria-label="Day-name strategy examples">
        {dateLabelOptions.map((option) => (
          <article className={mode === option.id ? "is-active" : undefined} key={option.id}>
            <span>{option.label}</span>
            <strong lang={option.sampleLanguage}>{option.sample}</strong>
          </article>
        ))}
      </div>
      <div className="article-calendar-frame">
        <QunoInfiniteCalendar
          ariaLabel="Calendar with localized date labels"
          locale={activeOption.locale}
          formatters={{ dayLabel: activeOption.dayLabel }}
          calendars={articleCalendars}
          renderEvent={ArticleEventCard}
          initialDateKey={articleDateKey}
          loadEvents={loadNavigationEvents}
          now={articleNow}
          selectedCalendarIds={["provider-a", "room-1"]}
          settings={settings}
          view={view}
        />
      </div>
    </CalendarDemoShell>
  );
}

function localCalendarDayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
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

function shiftDateKey(dateKey: string, amount: number): `${number}-${number}-${number}` {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10) as `${number}-${number}-${number}`;
}

export function EverythingTogetherDemo() {
  const calendarRef = useRef<QunoInfiniteCalendarHandle>(null);
  const sequenceRef = useRef(0);
  const eventsRef = useRef<CalendarEvent[]>([...overlapEvents, ...navigationEvents.slice(articleEvents.length)]);
  const [zoom, setZoom] = useState(1.25);
  const [status, setStatus] = useState("The complete scheduling surface is ready");
  const loadEvents = useCallback<LoadEvents>(async (request) => filterEvents(eventsRef.current, request), []);
  const settings = useMemo(() => ({ ...themeSettings.clinical, zoom }), [zoom]);

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
      event.id === request.event.id ? applyEventMove({ event, request }) : event
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
    calendarRef.current?.commitVisibleEvent({ event, ...{ appearing: true } });
    calendarRef.current?.scrollToDateTime({ date: articleDateKey, time: "15:30" });
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
        </div>
      }
    >
      <div className="article-calendar-frame">
        <QunoInfiniteCalendar
          ref={calendarRef}
          ariaLabel="Complete calendar system example"
          calendars={articleCalendars}
          className="article-themed-calendar theme-clinical"
          renderEvent={ArticleEventCard}
          initialDateKey={articleDateKey}
          loadEvents={loadEvents}
          now={articleNow}
          onEventCreateRequest={createEvent}
          onEventMoveRequest={moveEvent}
          onZoomChange={({ zoom }) => setZoom(zoom)}
          selectedCalendarIds={["provider-a", "room-1", "equipment-1"]}
          settings={settings}
        />
      </div>
    </CalendarDemoShell>
  );
}
