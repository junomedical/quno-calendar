# Usage Recipes

Import the component and stylesheet from the package entrypoint:

```tsx
import { CalendarRoot, type EventRendererProps, type LoadEvents } from "quno-calendar";
import "quno-calendar/styles.css";
```

Local examples in this repository import from `src/lib`, but package consumers should use `quno-calendar`.

## Read-Only Calendar

Use `CalendarRoot` with calendars, selected ids, an async visible-range loader, and an event renderer.

```tsx
const calendars = [{ id: "provider-a", name: "Provider A" }];

const loadEvents: LoadEvents = async ({ startDate, endDate, calendarIds }) => {
  return api.events({ startDate, endDate, calendarIds });
};

function EventCard({ event, status, style }: EventRendererProps) {
  return (
    <article style={style} data-status={status}>
      <strong>{event.title}</strong>
      {event.subtitle ? <span>{event.subtitle}</span> : null}
    </article>
  );
}

<CalendarRoot
  calendars={calendars}
  selectedCalendarIds={["provider-a"]}
  loadEvents={loadEvents}
  eventRenderer={EventCard}
  view="infinite-horizontal"
/>;
```

Repository example: `src/examples/ReadOnlyCalendar.tsx`.

## Vertical Planner

Use `view="infinite-vertical"` for resource columns with time running vertically.

```tsx
<CalendarRoot
  {...calendarProps}
  view="infinite-vertical"
  settings={{
    startHour: 8,
    endHour: 18,
    zoom: 1.8,
    verticalColumnMinWidth: 280,
    verticalColumnOverlapCapacity: 3,
    verticalColumnOverlapGrowth: 90
  }}
/>
```

Repository example: `src/examples/VerticalPlanner.tsx`.

## Drag And Create

The calendar requests changes. Parent code validates and persists them.

```tsx
<CalendarRoot
  {...calendarProps}
  onEventMoveRequest={async (request) => {
    await api.moveEvent(request);
    return true;
  }}
  onEventCreateRequest={async (request) => {
    return api.createEvent(request);
  }}
/>
```

Returning `false` from `onEventMoveRequest` rejects a drop. Returning a created event from `onEventCreateRequest` lets the visible cache show the committed event immediately.

Repository example: `src/examples/DragCreateCalendar.tsx`.

## Controlled Create/Edit Draft

Use controlled drafts when create/edit UI lives outside the calendar.

```tsx
<CalendarRoot
  {...calendarProps}
  activeDraft={activeDraft}
  onEventDraftRequest={(request) => openCreateForm(request)}
  onEventActivate={(request) => openEditForm(request)}
  onActiveDraftMoveRequest={(request) => updateDraftTimeAndCalendar(request)}
/>
```

While an edit draft is active, the calendar hides the loaded source event and renders the controlled draft in its proposed position. Parent code decides how save, cancel, validation, and form fields work.

Repository example: `src/examples/ControlledDraftCalendar.tsx`.

## Availability Editing

Availability uses normal events with `kind: "availability"`. In appointment mode, availability renders as background context. In availability mode, availability blocks become the active editable layer.

```tsx
<CalendarRoot
  {...calendarProps}
  interactionMode="availability"
  onEventCreateRequest={(request) => createAvailability(request)}
/>
```

Repository example: `src/examples/AvailabilityEditor.tsx`.

## Data Shape

Use `calendarId` for a single rendered calendar and `calendarIds` when one event should render in multiple selected calendars.

```tsx
const event = {
  id: "event-a",
  calendarId: "provider-a",
  calendarIds: ["provider-a", "room-1"],
  title: "Initial consultation",
  start: "2026-07-04T09:00:00",
  end: "2026-07-04T10:00:00"
};
```

## Navigation And Zoom

Use the imperative handle for parent-owned navigation. Keep zoom controlled through `settings.zoom` and `onZoomChange`.

```tsx
const calendarRef = useRef<CalendarNavigationHandle>(null);

<CalendarRoot ref={calendarRef} {...calendarProps} settings={{ ...settings, zoom }} onZoomChange={setZoom} />;

calendarRef.current?.scrollToDateTime("2026-07-04", "09:30");
```

`initialDateKey` sets the initial virtual range anchor. If omitted, the calendar starts around `now`.
