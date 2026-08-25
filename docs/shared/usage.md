# Unified Usage Guide

The live project overview is available at `/`. It links to four task-oriented field guides:

- `/guide/infinite-calendar`
- `/guide/datepicker`
- `/guide/date-input`
- `/guide/date-parser`

Each guide has a focused Demo destination. This document remains the single source for copyable production recipes
across all four independent feature entry points.

## Entry points

```tsx
import type { DateRange, IsoDate } from "@quno/calendar";
import { QunoInfiniteCalendar } from "@quno/calendar/infinite-calendar";
import { QunoDatePicker } from "@quno/calendar/datepicker";
import { QunoDateInput } from "@quno/calendar/date-input";
import { parseDateInput, tokenizeDateInput } from "@quno/calendar/date-parser";
```

Add only the optional stylesheets needed by the browser application. JavaScript imports do not inject CSS.

Import the component and stylesheet from the package entrypoint:

```tsx
import { QunoInfiniteCalendar, type EventRendererProps, type LoadEvents } from "@quno/calendar/infinite-calendar";
import "@quno/calendar/infinite-calendar/styles.css";
```

Repository examples use the same public subpath aliases as package consumers.

The stylesheet is an explicit package asset; JavaScript does not inject it. This keeps both ESM imports and CommonJS `require("@quno/calendar/infinite-calendar")` safe in Node/SSR code. Import the stylesheet from the browser application entrypoint once.

For a concept-first introduction with live examples, read
[`Inside an infinite calendar`](../../demo/guide/timeline/README.md). It combines the same public
contracts below into a single editorial walkthrough without introducing a second API layer.

## Quno/Infinite Calendar: read-only schedules

Use `QunoInfiniteCalendar` with calendars, selected ids, an async visible-range loader, and an event renderer.

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

<QunoInfiniteCalendar
  calendars={calendars}
  selectedCalendarIds={["provider-a"]}
  loadEvents={loadEvents}
  eventRenderer={EventCard}
  view="infinite-horizontal"
/>;
```

Parent controls that store the active orientation can import the package-owned
`CalendarView` type. It contains `"infinite-horizontal"` and `"infinite-vertical"`.

Repository example: the read-only chapter in
[`ArticleRecipeDemos.tsx`](../../demo/guide/timeline/ArticleRecipeDemos.tsx) and the
[integration field guide](../../demo/guide/timeline/README.md).

## Custom Event Card Structure

The calendar owns the event shell’s time geometry; `eventRenderer` owns the content hierarchy inside it. Products can
therefore extend their event records with domain fields and choose which field leads the card for the current workflow:

```tsx
type ProductEvent = CalendarEvent & {
  productGroup: string;
  patientName: string;
  roomNumber: string;
};

function ProductEventCard({ event, style }: EventRendererProps) {
  const item = event as ProductEvent;
  const primary = {
    product: item.productGroup,
    patient: item.patientName,
    room: item.roomNumber
  }[grouping];

  return (
    <article style={style}>
      <small>{grouping}</small>
      <strong>{primary}</strong>
    </article>
  );
}

<QunoInfiniteCalendar {...calendarProps} eventRenderer={ProductEventCard} />;
```

Changing renderer hierarchy does not alter event times, overlap lanes, loading, or shell geometry. Keep the renderer
referentially stable when its hierarchy has not changed.

Each event shell is already exposed as a named `calendar-event` size container. Use CSS container queries when card
content should respond to its own rendered width or height rather than the browser viewport:

```css
@container calendar-event (width < 120px) {
  .product-event-card__details,
  .product-event-card__time {
    display: none;
  }
}

@container calendar-event (height < 54px) {
  .product-event-card__secondary {
    display: none;
  }
}
```

This lets the same renderer keep full context in a roomy shell, preserve only the title when overlap makes a card
narrow, or remove secondary details when a compact row makes it short.

Repository example: the custom-card structure chapter in
[`ArticleProductDemos.tsx`](../../demo/guide/timeline/ArticleProductDemos.tsx).

## Calendar Colors

The calendar's surfaces, labels, grid, current-time marker, shadow, and default event accent use inherited CSS custom
properties. Set them on the calendar class or any ancestor; the library retains built-in fallbacks when a value is omitted.

```css
.clinic-calendar {
  --quno-calendar-surface: #ffffff;
  --quno-calendar-header-surface: #f6f8fb;
  --quno-calendar-label-surface: #fbfcfe;
  --quno-calendar-alternate-surface: #f7faf9;
  --quno-calendar-cell-border: #d9e0e8;
  --quno-calendar-text: #17202a;
  --quno-calendar-text-secondary: #536273;
  --quno-calendar-now-accent: #d92d20;
  --quno-calendar-event-accent: #2563eb;
  --quno-calendar-shadow: none;
}
```

`CalendarEvent.color` remains the event-specific override. Inline themes are type-safe through the exported
`QunoInfiniteCalendarStyle` contract. `--quno-calendar-vertical-header-bg` remains a vertical-only compatibility override; new themes should
use `--quno-calendar-header-surface`.

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

By default, the loader keeps seven calendar days warm before the first rendered date and seven after the last rendered date. It only requests dates that are neither loaded nor already in flight. When missing dates sit on both sides of an already-loaded window, they are sent as separate ranges rather than refetching the cached middle.

Replace the policy when a product has a different latency or navigation profile:

```tsx
import type { EventPrefetchPolicy } from "@quno/calendar/infinite-calendar";

const eventPrefetchPolicy: EventPrefetchPolicy = ({ visibleDateKeys, selectedCalendarIds }) => {
  const navigationBuffer = selectedCalendarIds.length > 20 ? 2 : Math.ceil(visibleDateKeys.length / 2);
  return { beforeDays: navigationBuffer, afterDays: navigationBuffer * 2 };
};

<QunoInfiniteCalendar {...calendarProps} eventPrefetchPolicy={eventPrefetchPolicy} />;
```

Return `{ beforeDays: 0, afterDays: 0 }` to load only rendered dates. Keep a custom policy referentially stable when possible; changing it recalculates the desired warm window but does not invalidate dates that are already fresh.

When navigation reaches a date before its events load, the date/resource grid is already real and interactive. Late events are added without receiving browser focus. In the horizontal view:

- `scrollToDate(date)` keeps that date header at the same viewport Y while dense rows expand below it.
- `scrollToDateTime(date, time)` applies the same vertical rule and leaves the requested time coordinate unchanged on the X axis.
- If the viewport is already partway inside a calendar row, the calendar preserves the date, calendar id, and pixel offset inside that row. Height added above the row is compensated before paint.
- If that calendar disappears during the same update, restoration falls back to the captured date-local pixel and clamps it inside the date.

In the vertical view, event overlap can widen resource columns but does not change the settings-owned date/time height, so the visible date and time stay fixed. See [Async Loading And Layout](../infinite-calendar/flows/async-loading-and-layout.md) for the complete request, cache, measurement, and focus diagrams.

Repository example: the preloading and late-data chapters in
[`ArticleRecipeDemos.tsx`](../../demo/guide/timeline/ArticleRecipeDemos.tsx) and
[`ArticleDemos.tsx`](../../demo/guide/timeline/ArticleDemos.tsx). The preloading exhibit also lists
successful loader results outside the calendar, making warm events visible before their dates enter the rendered
window.

The repository demo starts with an instant response from its `POST /api/demo-events` mock endpoint so its normal
interaction path does not introduce a delayed full event-card paint after a quick create/cancel flow. Its **API delay**
selector still offers 250ms, 1s, and 3s responses for deliberate loading tests. Vite middleware serves the endpoint
locally and a matching Web handler serves it when the demo is deployed to Vercel. A sidebar status reports pending
requests even when stale events remain visible. Changing latency creates a new abort-aware loader generation;
selecting a dataset or navigating while delayed demonstrates immediate grid rendering, stale-data retention, and
obsolete-request cancellation. The HTTP adapter belongs to the demo; the library remains transport-agnostic through
`LoadEvents`.

To deploy this repository's demo on Vercel, leave the Root Directory at the repository root. The checked-in
`vercel.json` selects `npm run build:demo`, publishes `dist-demo`, provides client-side route fallback, and deploys the
demo endpoint from `api/demo-events.ts`. No Vercel environment variables are required for the fixture-backed demo.

## Vertical Planner

Use `view="infinite-vertical"` for resource columns with time running vertically.

```tsx
<QunoInfiniteCalendar
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

Repository example: the horizontal/vertical overlap comparison in
[`ArticleDemos.tsx`](../../demo/guide/timeline/ArticleDemos.tsx).

## Date Labels And Localization

Date labels use the browser or server runtime locale by default. Set `settings.dateLocale` to a BCP 47 locale string
or locale priority list when the product needs deterministic output, especially during server rendering. The same
setting applies to horizontal date headers and both lines of vertical date headers.

Use `dayNameGenerator` when the product should own the complete displayed label:

```tsx
import type { DayNameGenerator } from "@quno/calendar/infinite-calendar";

const dayNameGenerator: DayNameGenerator = (date, locale) =>
  new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);

<QunoInfiniteCalendar
  {...calendarProps}
  settings={{
    ...settings,
    dateLocale: "de-DE",
    dayNameGenerator
  }}
/>;
```

The generator receives the local calendar `Date` and the configured locale, and its return value replaces the complete
default label. This lets a product render `Tomorrow`, `6 Jul 2026`, or a machine sequence without a built-in date being
prepended. In the vertical view, generated labels use the primary line rather than retaining the default two-line
month/day and weekday structure. Keep the function referentially stable when it is created inside a React component.
Without a generator, English labels retain ordinal days and respect locale ordering (`July 4th` in `en-US`, `4th July`
in `en-GB`); other locales use their native month/day formatting.

Repository example: the date-localization chapter in
[`ArticleProductDemos.tsx`](../../demo/guide/timeline/ArticleProductDemos.tsx).

## Quno/Datepicker

The picker accepts `null` or an inclusive `{ start, end }` range of timezone-free `IsoDate` values. A single day has equal endpoints. Controlled and uncontrolled usage share the same model.

```tsx
import { useState } from "react";
import type { DateRange } from "@quno/calendar";
import { QunoDatePicker } from "@quno/calendar/datepicker";
import "@quno/calendar/datepicker/styles.css";

function TravelDates() {
  const [value, setValue] = useState<DateRange | null>(null);
  return <QunoDatePicker value={value} onChange={setValue} weekStartsOn={1} />;
}
```

Use `selectionMode="single"` when the product chooses one day while retaining the `DateRange` state shape. `initialMonth` controls only the initial view; navigation and Clear do not unexpectedly change one another. Consumer customization is presentational through scoped `--quno-date-picker-*` properties, typed `classNames`, stable `data-slot`/state attributes, and `getDayCellProps`.

## Quno/Date Input

```tsx
import { QunoDateInput } from "@quno/calendar/date-input";
import { parseDateInput, tokenizeDateInput } from "@quno/calendar/date-parser";
import "@quno/calendar/date-input/styles.css";

const parsed = parseDateInput("previous week", {
  expectedRange: { start: "2025-01-01", end: "2027-12-31" },
  referenceDate: "2026-08-24",
  weekStartsOn: 0,
  locale: "en-GB"
});

<QunoDateInput
  value={value}
  onChange={setValue}
  expectedRange={{ start: "2025-01-01", end: "2027-12-31" }}
  referenceDate="2026-08-24"
  weekStartsOn={0}
/>;
```

The input consumes the headless parser contract internally while both share the timezone-free range model. Use `selectionMode="single"` for one day or the
default `selectionMode="range"` for an inclusive period; both return `DateRange`. Numeric, ISO-like, and month-name
formats are accepted, while `locale` and `preferredDateOrder` resolve ambiguous numeric dates. The required
`expectedRange` supplies the realistic period used to infer missing years and rank ambiguity. It is a ranking hint
rather than a validity boundary: an explicit date outside it still resolves, so products apply their own disabled-date
or business-period validation after parsing.

Enter and blur commit. Arrow Up and Arrow Down edit the day, month, year, duration unit, or range endpoint under the
caret. Parser language, lexicon, formatting, labels, and controlled/uncontrolled state are configurable. Import
`tokenizeDateInput` from `@quno/calendar/date-parser` when an integration needs recognition tokens without rendering the input.

Set `preferredDateOrder` to `"dmy"`, `"mdy"`, `"ymd"`, or `"locale"`. A value such as `3/4/2026` therefore follows the
product convention while ISO-like and month-name dates remain explicit. Use `parserLanguages={["en", "de"]}` when one
field should recognize both languages at once. Recognition languages do not change presentation: `locale` and the
optional formatter still own the committed display value.

`previous day` resolves to yesterday. `this week`, `previous week`, `next week`, and named weekday phrases respect
`weekStartsOn`, using the same `WeekStart` format as `QunoDatePicker`: `0` is Sunday, `1` is Monday, through `6` for
Saturday. The default is Monday. Month and year phrases select complete calendar periods independently of that setting.
For example, with `weekStartsOn={0}`, `this week` is Sunday–Saturday and `this Monday` is the Monday inside that same
week. All seven English weekday names and their common abbreviations are recognized. Extend `previous` or
`weekdayNames` through the public lexicon when a product needs additional wording.

Compose `QunoDateInput` with `QunoDatePicker` by passing the same controlled `DateRange` and `onChange` to both public
entry points. When an input update changes only one endpoint, move the picker’s visible month to that changed date;
when both endpoints change, fall back to the nearest off-screen endpoint. The independently imported date-input payload
is currently 6.77 KiB gzip for JavaScript and 0.58 KiB gzip for its optional stylesheet. It uses the React 18+ peer,
supports Preact 10.18+ through `preact/compat`, imports safely in SSR, and has no date-library runtime dependency. The
combined package’s TanStack virtualizer dependency belongs to Infinite Calendar and is not imported by the
date-input entry.

For a compact range field, let `QunoDateInput` replace the picker’s selected-period summary and Clear action. Open a
`selectionMode="range"` picker while focus remains in the composed control, hide its duplicate selection header with
the public `selection-header` slot, and close it when focus or an outside pointer leaves. Typing and picking continue to
share one controlled `DateRange`; an empty committed input clears that value without a second action.

## Quno/Date Parser

Import parsing and tokenization from the headless entry point. It has no stylesheet or framework runtime:

```ts
import { parseDateInput, tokenizeDateInput } from "@quno/calendar/date-parser";

const result = parseDateInput("this week", {
  expectedRange: { start: "2025-01-01", end: "2027-12-31" },
  referenceDate: "2026-08-24",
  weekStartsOn: 1,
  preferredDateOrder: "dmy",
  parserLanguages: ["en", "de"]
});
const tokens = tokenizeDateInput("next Monday");
```

The parser recognizes explicit formats, relative dates and calendar periods, inclusive ranges, multilingual vocabulary, and consumer lexicon extensions. It remains timezone-free and safe to import in ESM, CommonJS, Node, and SSR.
Lexicon extensions add deliberate aliases to the bounded grammar; they do not turn it into a general parser for
languages with different token boundaries or word order.

## Compose Quno/Datepicker and Quno/Infinite Calendar

Keep both components independent. A single-date picker can navigate the timeline through the public handle:

```tsx
const calendarRef = useRef<QunoInfiniteCalendarHandle>(null);

<QunoDatePicker
  selectionMode="single"
  onChange={(selection) => {
    if (selection) calendarRef.current?.scrollToDate(selection.start);
  }}
/>
<QunoInfiniteCalendar ref={calendarRef} {...timelineProps} />
```

Do not convert event timestamps with the picker’s UTC day arithmetic. Only the timeline day key passed to `scrollToDate` is an `IsoDate`.

## React, Preact, SSR, and production builds

React 18+ is the authored runtime. For Preact, install `preact` and map `react`, `react-dom`, `react-dom/test-utils`, and their JSX runtime imports to the corresponding `preact/compat` or `preact` modules in the consumer bundler. For Vite:

```ts
resolve: {
  alias: {
    react: "preact/compat",
    "react-dom": "preact/compat",
    "react-dom/test-utils": "preact/test-utils",
    "react/jsx-runtime": "preact/jsx-runtime"
  }
}
```

Every JavaScript entry is available as ESM and CommonJS and can be imported in Node without `document`. Stylesheets are independent browser assets and remain readable rather than minified in the published `dist` directory. React, React DOM, Preact compatibility, and `@tanstack/react-virtual` stay outside the feature bundles.

## Drag And Create

The calendar requests changes. Parent code validates and persists them.

Callbacks opt into their interaction families. Without a create callback, empty-grid pointer gestures remain inert.
Without a move or activate callback, existing event cards cannot start a drag/press interaction. A calendar with none of
these callbacks is read-only.

```tsx
<QunoInfiniteCalendar
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

Repository example: the parent-owned mutation chapter in
[`ArticleRecipeDemos.tsx`](../../demo/guide/timeline/ArticleRecipeDemos.tsx) stages move and create
proposals as `activeDraft` previews. Its explicit Accept action patches parent state and the visible cache, while Cancel
removes the preview without changing saved events.

## Controlled Create/Edit Draft

Use controlled drafts when create/edit UI lives outside the calendar.

```tsx
<QunoInfiniteCalendar
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

The target is semantic rather than lane-index based. If a save introduces collisions, participant changes, or new
metrics that move the event into another overlap lane, restoration resolves the new event geometry and keeps that event
at the captured viewport position.

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

Repository example: the focused creation, visual-focus, and motion chapters in
[`ArticleDemos.tsx`](../../demo/guide/timeline/ArticleDemos.tsx) and
[`ArticleSystemDemos.tsx`](../../demo/guide/timeline/ArticleSystemDemos.tsx).

## Availability Editing

Availability uses normal events with `kind: "availability"`. In appointment mode, availability renders as
pointer-transparent background context. In availability mode, normal appointment cards remain visible but become
pointer-transparent, and only availability blocks participate in move/draw hit-testing.

```tsx
<QunoInfiniteCalendar
  {...calendarProps}
  interactionMode="availability"
  onEventCreateRequest={(request) => createAvailability(request)}
/>
```

Repository example: the availability interaction-layer chapter in
[`ArticleSystemDemos.tsx`](../../demo/guide/timeline/ArticleSystemDemos.tsx).

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
const calendarRef = useRef<QunoInfiniteCalendarHandle>(null);
const [date, setDate] = useState<DateRange>({ start: "2026-07-04", end: "2026-07-04" });

<QunoDateInput
  expectedRange={{ start: "1900-01-01", end: "2100-12-31" }}
  selectionMode="single"
  value={date}
  onChange={(next) => {
    if (!next) return;
    setDate(next);
    calendarRef.current?.scrollToDate(next.start);
  }}
/>;

<QunoInfiniteCalendar ref={calendarRef} {...calendarProps} settings={{ ...settings, zoom }} onZoomChange={setZoom} />;
```

Date pickers, search results, command palettes, and “Today” controls can call the same handle without knowing the
calendar’s virtual-window geometry. Use `settings` for density and dimensions, then scope product CSS through
`className`; changing either preserves the same calendar integration and renderer contract.

Product controls do not need a separate submit step. The infinite-calendar demo uses `QunoDateInput` in single-date mode
and navigates to the committed day at its product-owned default focus time. It has no separate time field or Add event
action; creation begins by drawing on the timeline. Previous and next buttons can shift the controlled date and call the
same handle. Keep the five-minute time scale structure stable and let controlled zoom progressively reveal finer labels
instead of replacing tick nodes.

## Reveal And Focus An Event

Pass the complete event when the application already knows it. The calendar requests all known participant calendars
and briefly reports `status: "focused"` to the targeted row or column instance. If that card is already fully visible,
focus does not change either scroll axis. A partially clipped or offscreen target is brought into view.

```tsx
const [selectedCalendarIds, setSelectedCalendarIds] = useState(["provider-a"]);
const calendarRef = useRef<QunoInfiniteCalendarHandle>(null);

<QunoInfiniteCalendar
  ref={calendarRef}
  {...calendarProps}
  selectedCalendarIds={selectedCalendarIds}
  onCalendarVisibilityRequest={({ calendarIds }) => setSelectedCalendarIds(calendarIds)}
/>;

await calendarRef.current?.focusEvent(event, { preferredCalendarId: "room-1" });
```

For controlled navigation, pass a unique request id. Re-rendering the same id does not repeat the focus operation.

```tsx
<QunoInfiniteCalendar
  {...calendarProps}
  focusRequest={{ requestId: selectionVersion, event, preferredCalendarId: "room-1" }}
  onCalendarVisibilityRequest={({ calendarIds }) => setSelectedCalendarIds(calendarIds)}
  onFocusRequestComplete={(result) => reportFocusResult(result)}
/>
```

Focus means a visibility guarantee and temporary visual highlight, not DOM/keyboard focus or a persistent scroll lock.
Sticky headers and labels do not count as visible space: a card covered by them is revealed. Manual pointer, wheel,
touch, or scroll-key intent cancels an active request. Participant ids absent from `calendars`
cannot be revealed. An event whose weekday is present in `settings.excludedWeekdays` resolves with
`status: "unavailable"` and does not move the viewport. Repeating a request for an already-visible preferred
participant is stable: the coordinator captures that same local instance before restoring it, so repeated “reveal room”
or “reveal provider” actions do not accumulate viewport drift.

## Targeted Edit And Delete

Persist edits in the parent data source, then call `commitVisibleEvent`. Persist deletion first, then remove all visible
instances without reloading the range:

```tsx
const saved = await api.updateEvent(updatedEvent);
calendarRef.current?.commitVisibleEvent(saved, { previousEventId: updatedEvent.id });

await api.deleteEvent(saved.id);
calendarRef.current?.removeVisibleEvent(saved.id);
```

These methods only patch loaded calendar cache. The parent remains responsible for persistence and for keeping future
`loadEvents` responses consistent.

`initialDateKey` sets the initial virtual range anchor. If omitted, the calendar starts around `now`. The same handle also exposes viewport anchoring helpers for parent-owned forms: `captureViewportAnchor`, `restoreViewportAnchor`, and `cancelViewportAnchorRestore`. `commitVisibleEvent` patches one saved event into the currently loaded visible cache. `releaseActiveDraft` lets a parent close controlled draft UI while the calendar keeps the last draft shell mounted briefly for a fadeout; `durationMs` controls both the retention window and fade duration.

The date range is bounded and recenters automatically without a consumer setting. Ordinary scroll pauses use a
1.2-second idle delay; reaching the absolute top or bottom uses a 240 ms delay so the next bounded range becomes
available sooner. Both paths preserve the visible date and its date-local pixel offset. Changing
`settings.excludedWeekdays` also preserves the current included date (or advances an excluded date to the next included
date) while the bounded date sequence and dense variable row measurements are rebuilt.

Slider or external prop zoom keeps a visible current-time marker stationary by default. If that marker is outside the viewport, horizontal scrolling uses the time at the center of the visible grid, while the timeline origin keeps its left edge stationary. `Shift` + wheel instead preserves the time node under the pointer. Zoom reprojects event-shell geometry without reloading events, rebuilding prepared overlap cells, or rerunning an unchanged external event renderer.

## Finding The Owning Implementation

When extending Infinite Calendar, start with its [responsibility-domain index](../infinite-calendar/domains/README.md).
Each domain document lists every owning source file and links to the detailed runtime flows. The other products use
their product `README.md` and `decisions.md` as their ownership index, so behavior should be added to its existing owner
rather than a generic hooks or utilities folder.
