import { useCallback, useState } from "react";
import {
  QunoInfiniteCalendar,
  type CalendarEvent,
  type LoadEvents,
  type ProjectEvents
} from "@quno/calendar/infinite-calendar";
import { CalendarDemoShell } from "./ArticleDemos";
import { ArticleEventCard, articleCalendars, articleDateKey, articleSettings } from "./articleSupport";

const selectedCalendarIds = ["provider-a"];

export function EventProjectionDemo() {
  const [previewHour, setPreviewHour] = useState<number | null>(null);
  const [loadCount, setLoadCount] = useState(0);
  const loadEvents = useCallback<LoadEvents>(async () => {
    setLoadCount((count) => count + 1);
    return [];
  }, []);
  const projectEvents = useCallback<ProjectEvents>(
    ({ events, startDate, endDate }) => {
      if (previewHour === null) {
        return events;
      }
      const preview: CalendarEvent = {
        id: "draft:preview",
        calendarId: "provider-a",
        title: "Local rule preview",
        start: `${articleDateKey}T${previewHour}:00:00`,
        end: `${articleDateKey}T${previewHour + 1}:00:00`,
        kind: "availability"
      };
      return articleDateKey >= startDate && articleDateKey <= endDate ? [...events, preview] : events;
    },
    [previewHour]
  );

  return (
    <CalendarDemoShell
      data-testid="article-projection-demo"
      note="Preview changes are local; the persisted event loader stays stable"
      tools={
        <>
          <button onClick={() => setPreviewHour(10)}>Preview at 10:00</button>
          <button onClick={() => setPreviewHour(12)}>Move preview to 12:00</button>
          <button onClick={() => setPreviewHour(null)}>Clear preview</button>
          <output data-testid="projection-load-count">{loadCount} loads</output>
        </>
      }
    >
      <div className="article-calendar-frame">
        <QunoInfiniteCalendar
          calendars={articleCalendars}
          selectedCalendarIds={selectedCalendarIds}
          initialDateKey={articleDateKey}
          settings={articleSettings}
          loadEvents={loadEvents}
          projectEvents={projectEvents}
          renderEvent={ArticleEventCard}
        />
      </div>
    </CalendarDemoShell>
  );
}
