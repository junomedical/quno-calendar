import type { CalendarEvent } from "@quno/calendar/infinite-calendar";
import { calendars } from "./calendarFixtures";
export const eventClock = (value: string) =>
  new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
export function eventDate(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function CalendarEditor({
  draft,
  editing,
  update,
  save,
  cancel
}: {
  draft: CalendarEvent;
  editing: boolean;
  update: (event: CalendarEvent) => void;
  save: () => void;
  cancel: () => void;
}) {
  return (
    <form
      className="concept-editor"
      aria-label="Appointment editor"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <strong>{editing ? "Edit appointment" : "New appointment"}</strong>
      <label>
        Title
        <input
          data-action="event-title"
          value={draft.title}
          onChange={(event) => update({ ...draft, title: event.target.value })}
        />
      </label>
      <span>
        {eventClock(draft.start)}–{eventClock(draft.end)} ·{" "}
        {calendars.find((item) => item.id === draft.calendarId)?.name}
      </span>
      <div>
        <button type="button" onClick={cancel}>
          Cancel
        </button>
        <button data-action="save" disabled={!draft.title.trim()}>
          Save appointment
        </button>
      </div>
    </form>
  );
}
