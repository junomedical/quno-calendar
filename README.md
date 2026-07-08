# Quno Calendar

Reusable React infinite-calendar component with virtualized horizontal and vertical timeline views.

This project is still a `0.1.x` release, but the package surface is intentionally small: render `CalendarRoot`, provide calendars, load visible event ranges, and own product-specific event cards through `eventRenderer`.

## Install

```sh
npm install quno-calendar
```

```tsx
import { CalendarRoot, type EventRendererProps, type LoadEvents } from "quno-calendar";
import "quno-calendar/styles.css";
```

React and React DOM are peer dependencies. The package targets React 18-compatible ESM.

## Minimal Example

```tsx
const calendars = [{ id: "room-1", name: "Room 1" }];

const loadEvents: LoadEvents = async ({ startDate, endDate, calendarIds }) => {
  return fetch(`/api/events?start=${startDate}&end=${endDate}&calendars=${calendarIds.join(",")}`).then((response) =>
    response.json()
  );
};

function EventCard({ event, status, style }: EventRendererProps) {
  return (
    <article style={style} data-status={status}>
      <strong>{event.title}</strong>
      {event.subtitle ? <span>{event.subtitle}</span> : null}
    </article>
  );
}

export function Schedule() {
  return (
    <CalendarRoot
      calendars={calendars}
      selectedCalendarIds={["room-1"]}
      loadEvents={loadEvents}
      eventRenderer={EventCard}
      view="infinite-horizontal"
      settings={{ startHour: 8, endHour: 18, zoom: 1.2 }}
    />
  );
}
```

Use `view="infinite-vertical"` when calendars should render as columns and time should run top-to-bottom inside each date. `view="infinite"` remains a compatibility alias for the horizontal view.

## Interaction Model

The calendar does not persist mutations. Drag/drop and drawn creation are proposed through callbacks:

```tsx
<CalendarRoot
  {...props}
  onEventMoveRequest={async (request) => {
    await api.moveEvent(request);
    return true;
  }}
  onEventCreateRequest={async (request) => {
    return api.createEvent(request);
  }}
/>
```

For parent-owned create/edit forms, pass `activeDraft` and handle `onEventDraftRequest`, `onEventActivate`, and `onActiveDraftMoveRequest`.

## Examples

- `src/examples/ReadOnlyCalendar.tsx`
- `src/examples/DragCreateCalendar.tsx`
- `src/examples/ControlledDraftCalendar.tsx`
- `src/examples/VerticalPlanner.tsx`
- `src/examples/AvailabilityEditor.tsx`

The demo app also exposes source links in the sidebar for the larger interactive variants.

## Documentation

- [Usage recipes](./docs/usage.md)
- [Architecture overview](./docs/architecture.md)
- [Interface taxonomy](./docs/taxonomy.md)
- [Test plan](./docs/test-plan.md)
- [Decision log](./docs/decisions.md)
- [Changelog](./docs/changelog.md)
