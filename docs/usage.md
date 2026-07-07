# Library Usage Examples

For canonical names of interface parts such as date header, calendar row, overlap lane, event shell, and event card, see [Interface Taxonomy](./taxonomy.md).

## Minimal Read-Only Infinite Calendar
```tsx
import { CalendarRoot, type CalendarEvent, type LoadEvents } from "./lib";

const calendars = [{ id: "room-201", name: "Room 201" }];

const loadEvents: LoadEvents = async ({ startDate, endDate, calendarIds }) => {
  const events: CalendarEvent[] = await fetchEvents(startDate, endDate, calendarIds);
  return events;
};

function EventCard({ event, status, style }) {
  return (
    <div style={style} data-status={status}>
      <strong>{event.title}</strong>
      <span>{event.subtitle}</span>
    </div>
  );
}

export function Calendar() {
  return (
<CalendarRoot
  calendars={calendars}
  selectedCalendarIds={["room-201"]}
  loadEvents={loadEvents}
  eventRenderer={EventCard}
  view="infinite-horizontal"
  interactionMode="events"
  settings={{ startHour: 8, endHour: 18, zoom: 1, snapMinutes: 15 }}
/>
  );
}
```

Use `view="infinite-vertical"` when calendars should render left-to-right as columns and time should run top-to-bottom inside each day:

```tsx
<CalendarRoot
  calendars={calendars}
  selectedCalendarIds={["dr-kirillov", "room-201"]}
  loadEvents={loadEvents}
  eventRenderer={EventCard}
  view="infinite-vertical"
  settings={{ startHour: 8, endHour: 18, zoom: 1.2, snapMinutes: 15 }}
/>;
```

`view="infinite"` remains supported as a compatibility alias for `view="infinite-horizontal"`.

## Calendar and Event Data
Use `calendarId` for a single-row event. Use `calendarIds` when the same event should render in multiple selected rows, such as a doctor and a room:

```tsx
const event = {
  id: "appt-1",
  calendarId: "dr-kirillov",
  calendarIds: ["dr-kirillov", "room-201"],
  title: "Botox Injection",
  subtitle: "Becky Norman",
  start: "2026-07-04T09:00:00.000Z",
  end: "2026-07-04T10:00:00.000Z",
  color: "#0b6eff"
};
```

Use `kind: "availability"` for row-height availability blocks. Availability is rendered through the same `eventRenderer`, but it is treated as a background layer: it does not affect overlap stacking or row height, and users can draw new events on top of it.

```tsx
const availability = {
  id: "availability-room-201-2026-07-04",
  calendarId: "room-201",
  title: "Available",
  subtitle: "Room 201",
  start: "2026-07-04T08:00:00.000Z",
  end: "2026-07-04T18:00:00.000Z",
  kind: "availability"
};
```

## Availability Editing Mode
Set `interactionMode="availability"` when users should edit availability instead of appointments. Existing appointments stay visible as inactive background blocks, availability blocks become draggable, and drawn drafts are submitted as availability create requests:

```tsx
const [editAvailabilities, setEditAvailabilities] = useState(false);

<label>
  <input
    type="checkbox"
    checked={editAvailabilities}
    onChange={(event) => setEditAvailabilities(event.target.checked)}
  />
  Availabilities
</label>

<CalendarRoot
  {...calendarProps}
  interactionMode={editAvailabilities ? "availability" : "events"}
  onEventCreateRequest={(request) => {
    if (request.kind === "availability") {
      return createAvailability(request);
    }
    return createAppointment(request);
  }}
/>;
```

Availability moves still use `onEventMoveRequest`; check `request.event.kind === "availability"` for availability-specific validation.

`loadEvents` should return an event if any selected calendar matches:

```tsx
const loadEvents: LoadEvents = async ({ startDate, endDate, calendarIds }) => {
  const selected = new Set(calendarIds);
  return allEvents.filter((event) => {
    const eventCalendars = event.calendarIds?.length ? event.calendarIds : [event.calendarId];
    return event.start.slice(0, 10) >= startDate
      && event.start.slice(0, 10) <= endDate
      && eventCalendars.some((calendarId) => selected.has(calendarId));
  });
};
```

## Date Navigation
```tsx
import { useRef } from "react";
import { CalendarRoot, type CalendarNavigationHandle } from "./lib";

function CalendarWithNavigation(props) {
  const calendarRef = useRef<CalendarNavigationHandle>(null);

  return (
    <>
      <button type="button" onClick={() => calendarRef.current?.scrollToToday()}>
        Today
      </button>
      <button type="button" onClick={() => calendarRef.current?.scrollToDate("2026-08-12")}>
        Go to Aug 12
      </button>
      <button type="button" onClick={() => calendarRef.current?.scrollToDateTime("2026-08-12", "14:30")}>
        Go to Aug 12, 14:30
      </button>
      <CalendarRoot ref={calendarRef} {...props} />
    </>
  );
}
```

`scrollToDateTime(dateKey, time)` accepts a `yyyy-MM-dd` date key and an `HH:mm` local time string. In the horizontal view, the calendar scrolls vertically to the date and horizontally to the requested time column. In the vertical view, it scrolls vertically to the date plus the requested time offset inside that date.

The infinite view keeps vertical scrollbar dragging bounded to nearby dates. From the current top visible date, the scroll range covers one month before and one month after. After scrolling settles, the view recenters the scrollbar around the new top visible date and applies the same one-month bounds again, preserving the pixel offset inside that date so the visible content does not snap to the date header.

## Controlled Zoom and Shift Wheel
The view reads zoom from `settings.zoom`. Sliders and `Shift` + wheel should update the same parent state through `onZoomChange`. The PoC clamps zoom to `0.5-8` pixels per minute:

```tsx
function CalendarWithZoom(props) {
  const [zoom, setZoom] = useState(1.2);

  return (
    <>
      <input
        type="range"
        min="0.5"
        max="5"
        step="0.1"
        value={zoom}
        onChange={(event) => setZoom(Number(event.target.value))}
      />
      <CalendarRoot
        {...props}
        settings={{ ...props.settings, zoom }}
        onZoomChange={setZoom}
      />
    </>
  );
}
```

When `onZoomChange` is provided, `Shift` + vertical wheel over the calendar viewport requests a zoom change and cancels the native scroll action before the calendar viewport or browser window can scroll. The horizontal view uses zoom as horizontal pixels per minute; the vertical view uses the same value as vertical pixels per minute.

Zoom changes keep the current visible date anchored. In the vertical view, the calendar scales the intra-day offset to the new day height so changing zoom does not jump to a different date.

Time labels automatically thin out as zoom becomes dense. Quarter-hour labels render at normal scale, 15/45 labels disappear at medium density, and all minute labels disappear at the tightest scale so only hour labels remain.

The grid uses 15-minute columns through zoom `6`. Above zoom `6`, the row grid and time header switch to 5-minute cadence, showing labels like `9 5 10 15 ... 55` for finer high-zoom positioning.

In the vertical view, calendar columns fill available width with a `240px` base minimum. Each column fits up to three parallel overlapping events before growing; every additional overlap lane adds `80px` to that date/calendar column and its matching doctor-name header cell. Hovered appointments expand to the full column width and a minimum readable height for three-line cards.

Vertical date/doctor headers stay sticky at the top. The date cell and time pane stay sticky on the left, with the vertical left pane 30% narrower than `settings.labelWidth`. Vertical time labels use `8:00` for hours and plain minute numbers such as `15` or `30` for minor ticks. The first and last hour positions include 8px of vertical padding inside each day board.

## Custom Event Rendering
```tsx
function AppointmentCard({ event, status, style, isOverlapping }) {
  return (
    <article className={`appointment ${event.kind ?? "appointment"} ${status}`} style={style}>
      <strong>{event.title}</strong>
      <span>{event.subtitle}</span>
      <time>{formatRange(event.start, event.end)}</time>
      {isOverlapping ? <small>Overlapping</small> : null}
    </article>
  );
}
```

The same renderer is used for persisted events, drag shadows, drag previews, and new-event drafts. Use `status === "dragging"` for the original shadow, `status === "drop-preview"` for the moving card, and `status === "new"` for the drawn creation state. The calendar only passes status; product renderers decide whether color, opacity, borders, or content should change.

When an event has multiple `calendarIds`, hovering one visible instance focuses only that row instance. Dragging one visible instance gives every visible instance of that event `dragging` or `drop-preview` status so the multi-calendar move is represented across rows.

Hover expansion grows from the event's original row slot. This keeps dense-dataset cards visible near sticky day bands and lets CSS min/max sizing decide whether a card needs extra width.

Availability cards receive normal `existing` status and can branch on `event.kind === "availability"` for half-transparent background styling.

The calendar wraps every event renderer in a CSS size container named `calendar-event`. A renderer can ignore the supplied `style` prop and size itself with CSS instead:

Event shells expose `--event-accent` from `event.color` and `--event-accent-muted` as a softer background color derived from the same accent. Renderers can use those variables to keep card borders and backgrounds on the same hue.

```css
.appointment {
  width: 100%;
  height: 100%;
  background: var(--event-accent-muted);
  border-left: 6px solid var(--event-accent);
}

@container calendar-event (height < 40px) {
  .appointment-time {
    display: none;
  }
}

@container calendar-event (height < 28px) {
  .appointment-patient {
    display: none;
  }
}

@container calendar-event (height < 22px) {
  .appointment-title {
    font-size: 11px;
  }
}
```

This keeps content-priority decisions, such as hiding the time line before patient names and shrinking the event title, inside the external event component.

The demo event card includes a third time-range line, formatted like `9:00–19:30`. If the compact card height cannot fit three lines, the time line is hidden and becomes visible again when hover expansion gives the card enough height.

## Dragging Events Between Calendars
```tsx
async function handleMove(request) {
  const allowed = await validateMove(request);
  if (!allowed) return false;

  setEvents((events) =>
    events.map((event) =>
      event.id === request.event.id
        ? {
            ...event,
            calendarId: request.proposedCalendarId,
            calendarIds: request.proposedCalendarIds,
            start: request.proposedStart,
            end: request.proposedEnd
          }
        : event
    )
  );
  return true;
}

<CalendarRoot onEventMoveRequest={handleMove} {...calendarProps} />;
```

## Drawing a New Appointment
```tsx
function handleCreate(request) {
  const event = {
    id: crypto.randomUUID(),
    calendarId: request.calendarId,
    title: request.kind === "availability" ? "Available" : "New appointment",
    start: request.start,
    end: request.end,
    kind: request.kind === "availability" ? "availability" : "draft"
  };

  setEvents((events) => [...events, event]);
  return event;
}

<CalendarRoot onEventCreateRequest={handleCreate} {...calendarProps} />;
```

Returning the created event is optional, but useful. The infinite view adds the returned event to the currently loaded visible range immediately. If nothing is returned, the view keeps a local copy of the drawn draft so the user still sees the created appointment after mouse-up.

## Large Dataset Demo Configuration
```tsx
import { createDemoEvents, createRangeLoader } from "./demo/data";

const events = createDemoEvents(20_000);
const loadEvents = createRangeLoader(events);

<CalendarRoot
  calendars={demoCalendars}
  selectedCalendarIds={demoCalendars.slice(0, 8).map((calendar) => calendar.id)}
  loadEvents={loadEvents}
  eventRenderer={DemoEventCard}
  settings={{
    startHour: 8,
    endHour: 18,
    zoom: 1.2,
    snapMinutes: 15,
    excludedWeekdays: [0, 6]
  }}
/>;
```

The deterministic demo generator spreads events across all demo calendars and gives each event two calendar memberships. This keeps large scales from concentrating into only the first few rows while still demonstrating doctor-plus-room style rendering.

The demo generates weekday availability blocks for every calendar. Doctor/provider calendars use recurring weekday windows, such as morning or afternoon availability, and generated appointments are placed inside the primary calendar's availability window.
