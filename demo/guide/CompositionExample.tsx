import { useCallback, useRef, useState, type CSSProperties } from "react";
import type { DateRange } from "@quno/calendar";
import { QunoDatePicker } from "@quno/calendar/date-picker";
import {
  QunoCalendar,
  type EventRendererProps,
  type LoadEvents,
  type QunoCalendarHandle
} from "@quno/calendar/timeline";

const calendars = [{ id: "team", name: "Care team", color: "#7367f0" }];
const loadEvents: LoadEvents = async ({ startDate }) => [
  {
    id: `visit-${startDate}`,
    calendarId: "team",
    title: "Consultation",
    start: `${startDate}T09:00:00+02:00`,
    end: `${startDate}T10:00:00+02:00`
  }
];

function EventCard({ event, style }: EventRendererProps) {
  return (
    <article className="guide-composition__event" style={style}>
      {event.title}
    </article>
  );
}

const recipe = `const calendarRef = useRef<QunoCalendarHandle>(null);

<QunoDatePicker
  selectionMode="single"
  onChange={(selection) => {
    if (selection) calendarRef.current?.scrollToDate(selection.start);
  }}
/>
<QunoCalendar ref={calendarRef} {...timelineProps} />`;

export function CompositionExample() {
  const calendarRef = useRef<QunoCalendarHandle>(null);
  const [selection, setSelection] = useState<DateRange | null>({
    start: "2026-08-24",
    end: "2026-08-24"
  });
  const selectDate = useCallback((next: DateRange | null) => {
    setSelection(next);
    if (next) calendarRef.current?.scrollToDate(next.start);
  }, []);
  const timelineStyle = { height: 430 } satisfies CSSProperties;

  return (
    <section className="guide-section guide-composition" id="compose">
      <p className="guide-section__number">06</p>
      <h2>Compose QunoDatePicker with QunoCalendar</h2>
      <p>
        <strong>Try it:</strong> choose one date; the independent timeline scrolls to that day.
      </p>
      <div className="guide-composition__demo">
        <QunoDatePicker initialMonth="2026-08-01" onChange={selectDate} selectionMode="single" value={selection} />
        <QunoCalendar
          ariaLabel="Date-picker controlled schedule"
          calendars={calendars}
          eventRenderer={EventCard}
          initialDateKey="2026-08-24"
          loadEvents={loadEvents}
          ref={calendarRef}
          selectedCalendarIds={["team"]}
          style={timelineStyle}
        />
      </div>
      <details className="guide-recipe">
        <summary>Copy the composition recipe</summary>
        <pre>
          <code>{recipe}</code>
        </pre>
      </details>
    </section>
  );
}
