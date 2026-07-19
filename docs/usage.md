# Usage Recipes

Import the component and stylesheet from the package entrypoint:

```tsx
import { CalendarRoot, type EventRendererProps, type LoadEvents } from "quno-calendar";
import "quno-calendar/styles.css";
```

Local examples in this repository import from `src/lib`, but package consumers should use `quno-calendar`.

The stylesheet is an explicit package asset; JavaScript does not inject it. This keeps both ESM imports and CommonJS `require("quno-calendar")` safe in Node/SSR code. Import the stylesheet from the browser application entrypoint once.

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

Repository example: [`ReadOnlyCalendar.tsx`](../demo/examples/read-only/ReadOnlyCalendar.tsx) and its [recipe guide](../demo/examples/read-only/README.md).

## Delayed Or Cancellable APIs

`loadEvents` is a non-blocking data boundary. The calendar renders its date/resource grid immediately and keeps the last cached events visible while a request is slow, retried, or refreshed. Loading indicators should therefore live outside geometry-sensitive calendar rows and columns.

Forward the optional abort signal when the API client supports cancellation:

```tsx
const loadEvents: LoadEvents = async ({ startDate, endDate, calendarIds, signal }) => {
  const query = new URLSearchParams({
    startDate,
    endDate,
    calendarIds: calendarIds.join(",")
  });
  const response = await fetch(`/api/calendar-events?${query}`, { signal });
  if (!response.ok) throw new Error(`Event request failed: ${response.status}`);
  return response.json();
};
```

Keep `loadEvents` referentially stable with `useCallback` when it closes over application state. Change `eventVersion` only for broad persisted-data invalidation; accepted moves and individual saves can use the calendar's targeted cache patches. Obsolete and out-of-order responses are ignored even if an API client does not honor `signal`. Failed visible requests retry after 250 ms and 1 second, then become eligible again on a later invalidation or visibility change.

By default, the loader also keeps an adaptive buffer of dates warm before and after the rendered window. The buffer is derived from the number of rendered dates, grows sublinearly for larger viewports, and only requests dates that are neither loaded nor already in flight. When missing dates sit on both sides of an already-loaded window, they are sent as separate ranges rather than refetching the cached middle.

Replace the policy when a product has a different latency or navigation profile:

```tsx
import type { EventPrefetchPolicy } from "quno-calendar";

const eventPrefetchPolicy: EventPrefetchPolicy = ({ visibleDateKeys, selectedCalendarIds }) => {
  const navigationBuffer = selectedCalendarIds.length > 20 ? 2 : Math.ceil(visibleDateKeys.length / 2);
  return { beforeDays: navigationBuffer, afterDays: navigationBuffer * 2 };
};

<CalendarRoot {...calendarProps} eventPrefetchPolicy={eventPrefetchPolicy} />;
```

Return `{ beforeDays: 0, afterDays: 0 }` to load only rendered dates. Keep a custom policy referentially stable when possible; changing it recalculates the desired warm window but does not invalidate dates that are already fresh.

When navigation reaches a date before its events load, the date/resource grid is already real and interactive. Late events are added without receiving browser focus. In the horizontal view:

- `scrollToDate(date)` keeps that date header at the same viewport Y while dense rows expand below it.
- `scrollToDateTime(date, time)` applies the same vertical rule and leaves the requested time coordinate unchanged on the X axis.
- If the viewport is already partway inside a calendar row, the calendar preserves the date, calendar id, and pixel offset inside that row. Height added above the row is compensated before paint.
- If that calendar disappears during the same update, restoration falls back to the captured date-local pixel and clamps it inside the date.

In the vertical view, event overlap can widen resource columns but does not change the settings-owned date/time height, so the visible date and time stay fixed. See [Async Loading And Layout](./flows/async-loading-and-layout.md) for the complete request, cache, measurement, and focus diagrams.

Repository example: [`AsyncApiCalendar.tsx`](../demo/examples/async-api/AsyncApiCalendar.tsx) and its [late-data guide](../demo/examples/async-api/README.md).

The repository demo starts with a visible 1-second response from its local `POST /api/demo-events` mock endpoint and exposes an **API delay** selector with instant, 250ms, 1s, and 3s responses. A sidebar status reports pending requests even when stale events remain visible. Changing latency creates a new abort-aware loader generation; selecting a dataset or navigating while delayed demonstrates immediate grid rendering, stale-data retention, and obsolete-request cancellation. The HTTP adapter belongs to the demo; the library remains transport-agnostic through `LoadEvents`.

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

Repository example: [`VerticalPlanner.tsx`](../demo/examples/vertical-planner/VerticalPlanner.tsx) and its [recipe guide](../demo/examples/vertical-planner/README.md).

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

Returning `false` from `onEventMoveRequest` rejects a drop. Returning a created event from `onEventCreateRequest` lets the visible cache show the committed event immediately. Newly committed visible events briefly receive `status: "appearing"` in `eventRenderer` props so product renderers can play a save/create highlight. For parent-owned save flows, update your own event store and call `commitVisibleEvent` so the loaded visible cache changes one record instead of reloading the range.

Repository example: [`DragCreateCalendar.tsx`](../demo/examples/drag-create/DragCreateCalendar.tsx) and its [recipe guide](../demo/examples/drag-create/README.md).

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

Use the imperative handle to keep a draft, saved event, or fallback slot at the same viewport position while parent state changes:

```tsx
const anchor = calendarRef.current?.captureViewportAnchor({
  eventId: draft.event.id,
  calendarId: draft.event.calendarId,
  dateKey: draft.event.start.slice(0, 10),
  time: "09:30"
});

setActiveDraft(null);

calendarRef.current?.restoreViewportAnchor(anchor, {
  target: {
    eventId: savedEvent.id,
    calendarId: savedEvent.calendarId,
    dateKey: savedEvent.start.slice(0, 10),
    time: "09:30"
  },
  afterRecenter: true,
  cancelOnManualScroll: true
});
```

Patch the saved event into the loaded visible cache before clearing the controlled draft:

```tsx
setEvents((current) => current.map((event) => (event.id === previousEventId ? savedEvent : event)));

calendarRef.current?.commitVisibleEvent(savedEvent, {
  previousEventId,
  appearing: true
});

setActiveDraft(null);
```

If a parent-owned flow intentionally reloads through `eventVersion`, pass the committed ids in `appearingEventIds` so only those reloaded events receive the highlight once.

When cancelling a form, release the controlled draft before clearing parent state if the draft should fade out in place:

```tsx
calendarRef.current?.releaseActiveDraft({ animation: "fade-out", durationMs: 420 });
setActiveDraft(null);
```

Repository example: [`ControlledDraftCalendar.tsx`](../demo/examples/controlled-draft/ControlledDraftCalendar.tsx) and its [recipe guide](../demo/examples/controlled-draft/README.md).

## Availability Editing

Availability uses normal events with `kind: "availability"`. In appointment mode, availability renders as background context. In availability mode, availability blocks become the active editable layer.

```tsx
<CalendarRoot
  {...calendarProps}
  interactionMode="availability"
  onEventCreateRequest={(request) => createAvailability(request)}
/>
```

Repository example: [`AvailabilityEditor.tsx`](../demo/examples/availability/AvailabilityEditor.tsx) and its [recipe guide](../demo/examples/availability/README.md).

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

`initialDateKey` sets the initial virtual range anchor. If omitted, the calendar starts around `now`. The same handle also exposes viewport anchoring helpers for parent-owned forms: `captureViewportAnchor`, `restoreViewportAnchor`, and `cancelViewportAnchorRestore`. `commitVisibleEvent` patches one saved event into the currently loaded visible cache. `releaseActiveDraft` lets a parent close controlled draft UI while the calendar keeps the last draft shell mounted briefly for a fadeout; `durationMs` controls both the retention window and fade duration.

After horizontal scrolling, slider or external prop zoom keeps the time at the center of the visible grid stationary. At the timeline origin it keeps the left edge stationary. `Shift` + wheel instead preserves the time node under the pointer. Zoom reprojects event-shell geometry without reloading events, rebuilding prepared overlap cells, or rerunning an unchanged external event renderer.

## Finding The Owning Implementation

When extending the library, start with the [`responsibility-domain index`](./domains/README.md). Each domain document lists every owning source file and links to the detailed runtime flows. Source headers link back to the same source map, so behavior should be added to its existing owner rather than a generic hooks or utilities folder.
