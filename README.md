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

React and React DOM are peer dependencies. The package ships React 18-compatible ESM and CommonJS plus an explicit stylesheet; JavaScript imports are safe in Node/SSR.

## Minimal Example

```tsx
const calendars = [{ id: "room-1", name: "Room 1" }];

const loadEvents: LoadEvents = async ({ startDate, endDate, calendarIds, signal }) => {
  return fetch(`/api/events?start=${startDate}&end=${endDate}&calendars=${calendarIds.join(",")}`, { signal }).then(
    (response) => response.json()
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

The date/resource grid renders without waiting for `loadEvents`. Cached events remain visible during delayed refreshes, and obsolete requests are cancelled or ignored. The optional abort signal is backward compatible with loaders that do not support cancellation. Adjacent dates are prefetched through an adaptive default; pass `eventPrefetchPolicy` to customize the before/after buffer.

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

- [Examples guide](./demo/examples/README.md)
- [Read-only integration](./demo/examples/read-only/README.md)
- [Drag and create](./demo/examples/drag-create/README.md)
- [Controlled draft](./demo/examples/controlled-draft/README.md)
- [Vertical planner](./demo/examples/vertical-planner/README.md)
- [Availability editor](./demo/examples/availability/README.md)
- [Delayed async API](./demo/examples/async-api/README.md)

`src/` contains the reusable library only. The separately documented [`demo/`](./demo/README.md) application contains focused recipes and larger stress scenarios.

## Documentation

- [Usage recipes](./docs/usage.md)
- [Architecture overview](./docs/architecture.md)
- [Responsibility domains and source maps](./docs/domains/README.md)
- [Runtime flow guides and anchor taxonomy](./docs/flows/README.md)
- [Interface taxonomy](./docs/taxonomy.md)
- [Test plan](./docs/test-plan.md)
- [Decision log](./docs/decisions.md)
- [Changelog](./docs/changelog.md)
