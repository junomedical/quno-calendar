import { QunoInfiniteCalendar } from "@quno/calendar/infinite-calendar";
import { useMemo, useState } from "react";
import { CalendarDemoShell } from "./ArticleDemos";
import {
  ArticleEventCard,
  articleCalendars,
  articleDateKey,
  articleSettings,
  loadArticleEvents
} from "./articleSupport";

const controlledCalendars = articleCalendars.slice(0, 2);
const bothCalendarIds = controlledCalendars.map(({ id }) => id);
const primaryCalendarId = controlledCalendars[0]?.id ?? "provider-a";

export function ReactStateDemo() {
  const [selectedCalendarIds, setSelectedCalendarIds] = useState(bothCalendarIds);
  const [zoom, setZoom] = useState(1.25);
  const settings = useMemo(() => ({ ...articleSettings, zoom }), [zoom]);

  return (
    <CalendarDemoShell
      data-testid="article-react-state-demo"
      note={
        <span data-testid="article-react-state-value">
          React owns {selectedCalendarIds.length} calendar{selectedCalendarIds.length === 1 ? "" : "s"} ·{" "}
          {zoom.toFixed(2)}×
        </span>
      }
      tools={
        <div className="article-react-state-controls">
          <button
            aria-pressed={selectedCalendarIds.length === 1}
            onClick={() => setSelectedCalendarIds([primaryCalendarId])}
            type="button"
          >
            One calendar
          </button>
          <button
            aria-pressed={selectedCalendarIds.length === 2}
            onClick={() => setSelectedCalendarIds(bothCalendarIds)}
            type="button"
          >
            Two calendars
          </button>
          <button
            aria-label="Decrease controlled zoom"
            onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}
            type="button"
          >
            −
          </button>
          <output aria-label="Controlled zoom">{zoom.toFixed(2)}×</output>
          <button
            aria-label="Increase controlled zoom"
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
          ariaLabel="Calendar controlled by React state"
          calendars={controlledCalendars}
          eventRenderer={ArticleEventCard}
          initialDateKey={articleDateKey}
          loadEvents={loadArticleEvents}
          onCalendarVisibilityRequest={({ calendarIds }) => setSelectedCalendarIds(calendarIds)}
          onZoomChange={setZoom}
          selectedCalendarIds={selectedCalendarIds}
          settings={settings}
        />
      </div>
    </CalendarDemoShell>
  );
}
