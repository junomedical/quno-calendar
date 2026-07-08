import type { CalendarEvent, CalendarRow, EventRendererProps, LoadEvents } from "../lib";

export const exampleCalendars: CalendarRow[] = [
  { id: "provider-a", name: "Provider A", color: "#0b6eff" },
  { id: "room-1", name: "Room 1", color: "#059669" }
];

const exampleEvents: CalendarEvent[] = [
  {
    id: "event-a",
    calendarId: "provider-a",
    calendarIds: ["provider-a", "room-1"],
    title: "Initial consultation",
    subtitle: "Ava Miller",
    start: "2026-07-04T09:00:00",
    end: "2026-07-04T10:00:00",
    color: "#0b6eff"
  },
  {
    id: "availability-a",
    calendarId: "provider-a",
    title: "Available",
    start: "2026-07-04T08:00:00",
    end: "2026-07-04T12:00:00",
    color: "#059669",
    kind: "availability"
  }
];

export const loadExampleEvents: LoadEvents = async ({ startDate, endDate, calendarIds }) => {
  const selected = new Set(calendarIds);
  return exampleEvents.filter((event) => {
    const dateKey = event.start.slice(0, 10);
    const eventCalendarIds = event.calendarIds?.length ? event.calendarIds : [event.calendarId];
    return (
      dateKey >= startDate && dateKey <= endDate && eventCalendarIds.some((calendarId) => selected.has(calendarId))
    );
  });
};

export function ExampleEventCard({ event, status, style }: EventRendererProps) {
  return (
    <article
      style={{
        ...style,
        display: "grid",
        alignContent: "center",
        padding: "4px 8px",
        color: "#10202b",
        background: event.kind === "availability" ? "rgba(5, 150, 105, 0.16)" : "#e8f2ff",
        borderLeft: `5px solid ${event.color ?? "#0b6eff"}`,
        borderRadius: 6,
        opacity: status === "dragging" ? 0.5 : 1
      }}
    >
      <strong>{event.title}</strong>
      {event.subtitle ? <span>{event.subtitle}</span> : null}
    </article>
  );
}
