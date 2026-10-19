# Unified Usage Guide

The live project overview is available at `/`. It links to five task-oriented field guides:

- `/guide/infinite-calendar`
- `/guide/datepicker`
- `/guide/date-input`
- `/guide/date-parser`
- `/guide/timepicker`

Each guide has a focused Demo destination. This document remains the single source for copyable production recipes
across all five independent feature entry points.

## Entry points

```tsx
import type { DateRange, IsoDate } from "@quno/calendar";
import { QunoInfiniteCalendar } from "@quno/calendar/infinite-calendar";
import { QunoDatePicker } from "@quno/calendar/datepicker";
import { QunoDateInput } from "@quno/calendar/date-input";
import { parseDateInput, tokenizeDateInput } from "@quno/calendar/date-parser";
```

Infinite Calendar JavaScript has a 50 KiB gzip ceiling; its optional stylesheet has a separate 2 KiB ceiling.
The headless Date Parser JavaScript entry point has a 7 KiB gzip ceiling.

Add only the optional stylesheets needed by the browser application. JavaScript imports do not inject CSS.
The package's public subpath types resolve under both modern and legacy Node-style TypeScript module resolution; no consumer-side declaration shim is needed.

Import the component and stylesheet from the package entrypoint:

```tsx
import { QunoInfiniteCalendar, type EventRendererProps, type LoadEvents } from "@quno/calendar/infinite-calendar";
import "@quno/calendar/infinite-calendar/styles.css";
```

Repository examples use the same public subpath aliases as package consumers.

For initial calendar loading, supply your own skeleton and keep it mounted as a prop:

```tsx
<QunoInfiniteCalendar
  {...calendarProps}
  isLoading={!initialDataReady && !initialError}
  loadingFallback={<MyCalendarSkeleton />}
  style={{ height: 600 }}
/>
```

The loading shell reserves the component's explicit dimensions even before resource metadata exists. Percentage
sizes and minimum dimensions apply once at that shell; the mounted timeline fills it. The skeleton can use `height: "100%"`.
The consumer owns readiness and error UI. While loading, the timeline mounts only when `selectedCalendarIds`
intersects the supplied `calendars`. Known IDs can arrive before calendar metadata; unmatched IDs keep the fallback
visible without mounting an empty timeline. Once a matching resource exists, event loading and layout continue beneath
the fallback. Clear loading after the initial data arrives; ordinary refreshes need not hide the calendar.

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
  renderEvent={EventCard}
  view="infinite-horizontal"
/>;
```

Parent controls that store the active orientation can import the package-owned
`CalendarView` type. It contains `"infinite-horizontal"` and `"infinite-vertical"`.

Repository example: the read-only chapter in
[`ArticleRecipeDemos.tsx`](../../demo/guide/timeline/ArticleRecipeDemos.tsx) and the
[integration field guide](../../demo/guide/timeline/README.md).

## Local Event Previews

Keep `loadEvents` stable while editing a draft. Use `projectEvents` to change the display after the calendar cache:

```tsx
import type { ProjectEvents } from "@quno/calendar/infinite-calendar";

const projectEvents = useCallback<ProjectEvents>(
  ({ events, startDate, endDate, calendarIds }) => {
    const previews = expandDraft({ draft, startDate, endDate, calendarIds });
    return [...events.filter(keepSavedEvent), ...previews];
  },
  [draft]
);

<QunoInfiniteCalendar {...calendarProps} loadEvents={loadEvents} projectEvents={projectEvents} />;
```

The dates are inclusive local date keys and include empty rendered dates. Return a new collection without mutating
cached records. Events outside the rendered dates are ignored. Changing or clearing the projection never refreshes
persisted data; use `eventVersion` or a changed `loadEvents` for saves and filters. Both orientations use projected
events for layout. An accepted drag updates only time and participant geometry on the cached saved record; projected
titles, colors, and other display fields stay local. Projection-only events enter the saved cache only through an explicit
`commitVisibleEvent` or loader response, not an accepted move. Recurrence expansion remains consumer-owned.
Try the lazy local-projection example in the field guide.

## Custom Event Card Structure

The calendar owns the event shell’s time geometry; `renderEvent` owns the content hierarchy inside it. Products can
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

<QunoInfiniteCalendar {...calendarProps} renderEvent={ProductEventCard} />;
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

`--quno-calendar-alternate-surface` follows every other resource in the complete displayed order, starting with the
first resource, in both orientations. Scrolling and virtual row pruning do not change a resource's shade. Use the
semantic surface tokens or `getDayCellProps` for custom treatments rather than mounted-child selectors.

## Calendar Day, Hour, Row, And Column Styling

Use `getDayProps` for date-wide presentation and `getDayCellProps` for a specific date/resource
intersection. A day result styles its date section, visible date header, and every resource cell. A cell result then
adds or overrides presentation for the matching horizontal row or vertical column, including its resource label or
header. Both typed contexts include the `IsoDate`, weekday, active view, and Today/weekend flags; the cell context also
includes the complete `CalendarRow`.

Use `getHourProps` for clock-time presentation shared across dates and resources. Its context reports the
zero-based `hour`, clipped `startMinute` and `endMinute`, and active view. The returned presentation paints the hour
band above day/resource backgrounds but below events, and also styles its visible time label.

```tsx
import type {
  QunoInfiniteCalendarCellCustomizer,
  QunoInfiniteCalendarDayCustomizer,
  QunoInfiniteCalendarHourCustomizer
} from "@quno/calendar/infinite-calendar";

const getDayProps: QunoInfiniteCalendarDayCustomizer = ({ isWeekend }) =>
  isWeekend
    ? {
        className: "weekend-day",
        style: { backgroundColor: "#fff3e3" },
        title: "Weekend"
      }
    : undefined;

const getDayCellProps: QunoInfiniteCalendarCellCustomizer = ({ calendar }) => {
  if (!calendar.id.startsWith("equipment-")) return undefined;

  return {
    className: "equipment-cell",
    style: { backgroundColor: "#e8f1ff" },
    title: `${calendar.name} equipment`
  };
};

const getHourProps: QunoInfiniteCalendarHourCustomizer = ({ hour }) =>
  hour === 12
    ? {
        className: "lunch-hour",
        style: { backgroundColor: "#dff5e8" },
        title: "Lunch hour"
      }
    : undefined;

<QunoInfiniteCalendar
  {...calendarProps}
  getDayProps={getDayProps}
  getDayCellProps={getDayCellProps}
  getHourProps={getHourProps}
/>;
```

The callbacks may return only `className`, `style`, and `title`; they cannot replace interaction handlers or
accessibility state. Cell presentation overrides conflicting day presentation, and fixed geometry wins over returned
layout properties. Date sections, headers, and labels expose `calendar-day`, `calendar-day-header`, and
`calendar-day-label` slots. Grid surfaces and resource labels/headers expose `calendar-cell` and `calendar-cell-label`.
Hour bands and labels expose `calendar-hour` and `calendar-hour-label`. Keep callbacks created inside a React component
referentially stable when possible.

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

By default, the loader keeps one screen warm on either side of the usable viewport. A screen is the viewport height
minus its sticky day header, measured along the date axis using actual date geometry. Row density, zoom, excluded
weekdays and viewport size determine how many dates fit. It only requests dates that are neither loaded nor already
in flight. Missing ranges on either side of a cached window load separately without refetching the cached middle.
Each positive screen distance keeps at least one adjacent included day warm on that side, even if its pixel buffer
fits entirely inside the visible day. Excluded weekdays are skipped. Setting a side to zero disables that minimum.

Replace the policy when a product has a different latency or navigation profile:

```tsx
import type { EventPrefetchPolicy } from "@quno/calendar/infinite-calendar";
import { useCallback, useState } from "react";

const [prefetchScreens, setPrefetchScreens] = useState(1);
const eventPrefetchPolicy = useCallback<EventPrefetchPolicy>(
  () => ({ beforeScreens: prefetchScreens, afterScreens: prefetchScreens }),
  [prefetchScreens]
);

<QunoInfiniteCalendar {...calendarProps} eventPrefetchPolicy={eventPrefetchPolicy} />;
```

Return `{ beforeScreens: 0, afterScreens: 0 }` to load only visible dates. Fractional distances such as `0.5` work.
Keep the callback stable with `useCallback`; changing the distance recalculates coverage without invalidating fresh
dates. Explicit `{ beforeDays: 7, afterDays: 7 }` retains a fixed calendar-week buffer when a product needs it.

When navigation reaches a date before its events load, the date/resource grid is already real and interactive. Late events are added without receiving browser focus. In the horizontal view:

- `scrollToDate({ date })` keeps that date header at the same viewport Y while dense rows expand below it.
- `scrollToDateTime({ date, time })` applies the same vertical rule and leaves the requested time coordinate unchanged on the X axis.
- If the viewport is already partway inside a calendar row, the calendar preserves the date, calendar id, and pixel offset inside that row. Height added above the row is compensated before paint.
- If that calendar disappears during the same update, restoration falls back to the captured date-local pixel and clamps it inside the date.

Row-count changes rebuild base date estimates as well as known loaded-day measurements. Horizontal selection changes
retain the date and a surviving resource's local offset after the scroll spacer commits. If a consumer derives selected
rows from loaded events, keep the previous nonempty selection while new dates load; do not temporarily select every
resource. Keep that occupancy index separate from the event records and keep the loader identity stable.

Delayed event loads preserve the currently displayed date and row, including large height changes on earlier dates.
The calendar commits the new scroll area and renders the corrected virtual range before paint. Consumers do not
need to scroll back after responses arrive. User navigation during a pending read remains authoritative.

In the vertical view, event overlap can widen resource columns but does not change the settings-owned date/time height, so the visible date and time stay fixed. See [Async Loading And Layout](../infinite-calendar/flows/async-loading-and-layout.md) for the complete request, cache, measurement, and focus diagrams.

Repository example: the preloading and late-data chapters in
[`ArticleRecipeDemos.tsx`](../../demo/guide/timeline/ArticleRecipeDemos.tsx) and
[`ArticleDemos.tsx`](../../demo/guide/timeline/ArticleDemos.tsx). The preloading exhibit also lists
successful loader results outside the calendar, making warm events visible before their dates enter the rendered
window. Jump to the prefetched date, wait until loading finishes, then choose **Back to starting date** to verify
the earlier cache is reused. A new warm window can request missing edges while its cached cards appear immediately.

For an external loading indicator, count every in-flight call rather than tracking only the latest request:

```tsx
const [pendingReads, setPendingReads] = useState(0);
const loadEvents = useCallback<LoadEvents>(
  async (request) => {
    setPendingReads((count) => count + 1);
    try {
      return await api.loadEvents(request);
    } finally {
      setPendingReads((count) => count - 1);
    }
  },
  [api]
);
const isFetching = pendingReads > 0;
```

Forward the complete request, including its abort signal, and let errors propagate to the calendar's retry handling.
The demo's shared tracker follows this pattern for both fixed guide fixtures and HTTP queries.

The repository demo starts with an instant response from its `POST /api/demo-events` mock endpoint so its normal
interaction path does not introduce a delayed full event-card paint after a quick create/cancel flow. Its **API delay**
selector still offers 250ms, 1s, and 3s responses for deliberate loading tests. Vite middleware serves the endpoint
locally through the same Web query handler that serves deployed Vercel requests. A sidebar status reports pending
requests even when stale events remain visible. Changing latency creates a new abort-aware loader generation;
selecting a dataset or navigating while delayed demonstrates immediate grid rendering, stale-data retention, and
obsolete-request cancellation. The HTTP adapter belongs to the demo; the library remains transport-agnostic through
`LoadEvents`.

To deploy this repository's demo on Vercel, leave the Root Directory at the repository root. The checked-in
`vercel.json` selects `npm run build:demo`, publishes `dist-demo`, provides client-side route fallback, and deploys the
demo endpoint from `api/demo-events.ts`. `build:demo` also bundles its server-only query service into `build/demo-api`;
the function's `vercel-build` hook also prepares it before function tracing. It stays outside browser assets and the published package. No Vercel
environment variables are required for the fixture-backed demo.

### Demo range-query endpoint

The showcase sends a query rather than uploading a browser-filtered event array:

```tsx
const loadEvents: LoadEvents = async ({ startDate, endDate, calendarIds, signal }) => {
  const response = await fetch("/api/demo-events?delay=0", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startDate, endDate, calendarIds, eventsPerYear: 1000 }),
    signal
  });
  if (!response.ok) throw new Error(`Event query failed: ${response.status}`);
  return (await response.json()).events;
};
```

Dates are inclusive. The demo supports 100, 1,000, 5,000 and 20,000 appointments per year, plus weekday availability,
for the requested years. The server accepts known calendar IDs and spans of at most 366 days. An empty calendar list
returns no events. It rejects invalid dates, unsupported sizes and legacy event-array uploads with HTTP 400.
The normal calendar issues much smaller settled-viewport reads plus its prefetch window.

The server generates and filters the records. Fixtures use local wall-clock timestamps and appointments fit every
participant's availability. The showcase overlays session creates, edits and moves after each response, including
changes saved during a pending read, while suppressing moved originals. Edits retain response order so equal-start
collision lanes remain stable. Dataset changes and page reloads reset local session edits; there is no shared backend
persistence. Try navigating to another month in Network tools, editing an appointment, then changing API delay to refetch.

### Read coverage while hiding calendar rows

When the endpoint returns all owners, pass their IDs as `loadCalendarIds` while `selectedCalendarIds` controls displayed rows. Hidden or empty rows then reuse the same read coverage. Omit this prop for loaders scoped to selected calendars. `eventPrefetchPolicy={() => ({ beforeScreens: 0, afterScreens: 0 })}` limits new reads to settled viewport dates. Render overscan remains available for smooth scrolling and does not expand this request window.

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

Date labels use the browser or server runtime locale by default. Set component-level `locale` to a BCP 47 locale string
or locale priority list for deterministic output. Use `formatters.dayLabel` to replace the complete label in either
orientation. Its context contains a timezone-free `IsoDate` and the configured locale:

```tsx
import { formatIsoDate } from "@quno/calendar";
import type { QunoInfiniteCalendarFormatters } from "@quno/calendar/infinite-calendar";

const formatters: QunoInfiniteCalendarFormatters = {
  dayLabel: ({ date, locale }) =>
    formatIsoDate({
      value: date,
      locale,
      options: { day: "numeric", month: "short", year: "numeric" }
    })
};

<QunoInfiniteCalendar {...calendarProps} locale="de-DE" formatters={formatters} />;
```

A custom label occupies the vertical primary line. Without an override, the default two-line vertical composition and
English ordinal days remain unchanged. Keep formatter functions stable when declaring them inside React components.

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
  return <QunoDatePicker value={value} onChange={({ value }) => setValue(value)} weekStartsOn={1} />;
}
```

Use `selectionMode="single"` when the product chooses one day while retaining the `DateRange` state shape. `initialMonth` controls only the initial view; navigation and Clear do not unexpectedly change one another. Consumer customization is presentational through scoped `--quno-date-picker-*` properties, typed `classNames`, stable `data-slot`/state attributes, and `getDayCellProps`.

Keep asynchronous day availability in parent state. `isDayDisabled` is synchronous so every pointer and keyboard
decision has an immediate answer; treat missing and failed results as disabled, and use `getDayCellProps` only to
present their state:

```tsx
type DayStatus = "loading" | "available" | "disabled" | "error";
const [statuses, setStatuses] = useState<Partial<Record<IsoDate, DayStatus>>>({});
const statusFor = (date: IsoDate): DayStatus => statuses[date] ?? "loading";
const limitDateFrom: IsoDate = "2026-08-06";
const limitDateTo: IsoDate = "2026-09-10";

<QunoDatePicker
  limitDateFrom={limitDateFrom}
  limitDateTo={limitDateTo}
  isDayDisabled={({ date }) => statusFor(date) !== "available"}
  getDayCellProps={({ date, isDisabled }) => ({
    className: `booking-day--${statusFor(date)}`,
    title: isDisabled ? "Not available" : undefined
  })}
/>;
```

A date before `limitDateFrom` or after `limitDateTo` is disabled without calling `isDayDisabled`; both limits themselves
are inclusive. Filter availability loads to the same bounds. Month navigation may still show surrounding context, but
those context dates cannot start, end, move, or become a single-day selection.

A disabled date cannot be selected alone or become a range start or end. It may occur inside a range whose endpoints
are enabled. A controlled value is never rewritten when availability changes; the consumer remains responsible for
revalidating persisted values.

## Quno/Date Input

```tsx
import { QunoDateInput } from "@quno/calendar/date-input";
import { parseDateInput, tokenizeDateInput } from "@quno/calendar/date-parser";
import "@quno/calendar/date-input/styles.css";

const parsed = parseDateInput({
  text: "previous week",
  ...{
    expectedRange: { start: "2025-01-01", end: "2027-12-31" },
    referenceDate: "2026-08-24",
    weekStartsOn: 0,
    locale: "en-GB"
  }
});

<QunoDateInput
  value={value}
  onChange={({ value }) => setValue(value)}
  expectedRange={{ start: "2025-01-01", end: "2027-12-31" }}
  referenceDate="2026-08-24"
  weekStartsOn={0}
/>;
```

The input projects the headless parser's endpoint dates into its timezone-free `DateRange` value. Use `selectionMode="single"` for one day or the
default `selectionMode="range"` for an inclusive period; both input modes emit `DateRange`. Numeric, ISO-like, and month-name
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
is currently 9.64 KiB gzip for JavaScript and 0.58 KiB gzip for its optional stylesheet. It uses the React 18+ peer,
supports Preact 10.18+ through `preact/compat`, imports safely in SSR, and has no date-library runtime dependency. The
Infinite Calendar engine has no external virtualizer dependency and is not imported by the
date-input entry.

For a compact range field, let `QunoDateInput` replace the picker’s selected-period summary and Clear action. Open a
`selectionMode="range"` picker while focus remains in the composed control, hide its duplicate selection header with
the public `selection-header` slot, and close it when focus or an outside pointer leaves. Use the blur event’s
`relatedTarget` to recognize focus moving to a picker control, and retain whether a pointer action began inside the
composition until its click settles. Start and End shortcuts focus the picker’s stable month-heading button before
jumping to their date and exiting. This keeps focus within the popup after pointer, Enter, or Space activation,
including with reduced motion. WebKit does not necessarily focus a clicked button, so keep the internal-pointer guard
for other picker interactions rather than relying on a delayed `document.activeElement` check. Typing and picking
continue to share one controlled `DateRange`; an empty committed input clears that value without a second action.

## Single-day date and time

With reference date `2026-10-06`, typing `6 oct 2pm` resolves one day at `14:00`, including across a multi-year expected range. Omitted years use Date Parser’s single-date ranking.

Both controls keep `value: DateRange | null` and store a separate timezone-free `HH:mm` clock. Set `timeMode` and
`selectionMode="single"` on both, then share `value`, `time`, `enabledHours`, `minuteCadence`, and `onChange`.
Time mode is ignored for ranges. Default cadence is 15; supported steps are 1, 2, 3, 4, 5, 6, 10, 15, 20, and 30 minutes.
Omitted or empty enabled hours means all 24. Date-only typing commits `time: null`; Clear removes both values.

```tsx
import { useState } from "react";
import type { DateTimeSelectionChange } from "@quno/calendar";
import { QunoDateInput } from "@quno/calendar/date-input";
import { QunoDatePicker } from "@quno/calendar/datepicker";
import "@quno/calendar/date-input/styles.css";
import "@quno/calendar/datepicker/styles.css";

function DateTimeField() {
  const [selection, setSelection] = useState<DateTimeSelectionChange>({ value: null, time: null });
  const [inputMonth, setInputMonth] = useState("empty");
  const options = {
    selectionMode: "single" as const,
    timeMode: true,
    enabledHours: [9, 10, 11, 12, 13, 14, 15, 16, 17],
    minuteCadence: 15 as const,
    value: selection.value,
    time: selection.time,
    onChange: setSelection
  };
  return (
    <>
      <QunoDateInput
        {...options}
        forceCadence={false}
        onChange={(next) => {
          setSelection(next);
          setInputMonth(next.value?.start.slice(0, 7) ?? "empty");
        }}
        aria-label="Date and time"
        expectedRange={{ start: "2025-01-01", end: "2027-12-31" }}
      />
      <QunoDatePicker key={inputMonth} {...options} initialMonth={selection.value?.start} />
    </>
  );
}
```

Sticky hours use larger, bold text (16px/700), while minute numbers match calendar days (13px/550).
Try `tomorrow 10:30AM`, press Enter, then select that day in the calendar to open time selection. Pick a minute beside a sticky
hour to return to days. While time navigation is open, the title shows the selected full date (for example, `19 October 2026`); override it with `formatters.timeDate({ date, locale })`. The header arrows select the previous/next enabled day, skipping disabled dates and respecting date limits, while preserving the time and open selector. Click the date title to return to day selection in the selected date’s month without changing the value. Clicking the month title from day selection opens month/year navigation. Escape also returns without committing. The selected clock appears in the summary above the calendar; there is no footer time button. At most six minutes occupy
one row, with [column counts chosen by cadence](../timepicker/README.md#value-and-settings). The input accepts the parser's English/German clocks regardless of picker cadence or enabled hours by
default. Set `forceCadence={true}` on `QunoDateInput` to reject off-cadence/disabled-hour clocks without rounding.
Distinct-clock intervals remain invalid. Date-field arrows retain time; clock arrows adjust hours or single minutes,
or cadence-sized minutes and enabled hours when forced. Enter/blur remain the commit points.

Use `defaultValue` and `defaultTime` for uncontrolled usage. Value and time can be controlled independently.
Changing settings does not rewrite persisted clocks; consumers own revalidation. The example remounts only when typing changes the input’s month so typed dates become visible. Picker day arrows manage their own visible month without remounting or losing the time view.
Live example: `/demo/date-time` and the date-time chapters in `/guide/datepicker` and `/guide/date-input`.

## Quno/Date Parser

Import parsing and tokenization from the headless entry point. It has no stylesheet or framework runtime:

```ts
import { parseDateInput, tokenizeDateInput } from "@quno/calendar/date-parser";

const result = parseDateInput({
  text: "this week",
  ...{
    expectedRange: { start: "2025-01-01", end: "2027-12-31" },
    referenceDate: "2026-08-24",
    weekStartsOn: 1,
    preferredDateOrder: "dmy",
    parserLanguages: ["en", "de"]
  }
});
const tokens = tokenizeDateInput({ text: "next Monday" });

// Read the parser's endpoint dates when composing with date-only UI values.
if (result.status === "success") {
  const value = { start: result.start.date, end: result.end.date };
  // Pass value to QunoDateInput or QunoDatePicker.
}
```

The parser recognizes explicit formats, relative dates and calendar periods, inclusive ranges, multilingual vocabulary, and consumer lexicon extensions. It remains timezone-free and safe to import in ESM, CommonJS, Node, and SSR.
Lexicon extensions add deliberate aliases to the bounded grammar; they do not turn it into a general parser for
languages with different token boundaries or word order.

### Optional dates and clock times

```ts
const timed = parseDateInput({
  text: "tomorrow 10:30PM",
  recognizeTime: true,
  referenceDate: "2026-10-05",
  expectedRange: { start: "2026-01-01", end: "2027-12-31" }
});
// { status: "success",
//   start: { date: "2026-10-06", time: "22:30" },
//   end: { date: "2026-10-06", time: "22:30" } }
const clockTokens = tokenizeDateInput({ text: "10:30PM", recognizeTime: true });
```

Clock recognition defaults to false. Successful and partial-range results always have `start` and `end` objects with
`date: IsoDate` and `time: string | null`. Clocks use `HH:mm` without a timezone; date-only or missing endpoint times
are `null`. Empty and invalid results contain only `status`. Time-only input uses `referenceDate`; `23:00–01:00` advances an undated
end to the next calendar day. Use `at` or `um` to disambiguate a bare hour from an accepted date. See the
[complete clock and range rules](../date-parser/README.md#optional-clock-recognition). Date Input can opt into single-day `timeMode`; see the [date-time composition](#single-day-date-and-time).

## Compose Quno/Datepicker and Quno/Infinite Calendar

Keep both components independent. A single-date picker can navigate the timeline through the public handle:

```tsx
const calendarRef = useRef<QunoInfiniteCalendarHandle>(null);

<QunoDatePicker
  selectionMode="single"
  onChange={({ value: selection }) => {
    if (selection) calendarRef.current?.scrollToDate({ date: selection.start });
  }}
/>
<QunoInfiniteCalendar ref={calendarRef} {...timelineProps} />
```

Do not convert event timestamps with the picker’s UTC day arithmetic. Only the timeline day key passed to `scrollToDate` is an `IsoDate`.

## React, Preact, SSR, and production builds

React 18+ is the authored runtime. React 19 is checked through a packed consumer typecheck, production build, and
warning-free development-browser mount. For Preact, install `preact` and map `react`, `react-dom`,
`react-dom/test-utils`, and their JSX runtime imports to the corresponding `preact/compat` or `preact` modules in the
consumer bundler. For Vite:

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

Every JavaScript entry is available as ESM and CommonJS and can be imported in Node without `document`. Stylesheets are independent browser assets and remain readable rather than minified in the published `dist` directory. React, React DOM and Preact compatibility stay outside the feature bundles. Infinite Calendar includes its own viewport engine.

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

A normal click invokes `onEventActivate`, including pointer jitter within four pixels that crosses a snap boundary.
A move request requires movement beyond that tolerance. Dragging away and back to the original slot invokes neither
activation nor a move request; the calendar tracks the gesture, so consumers need no pointer-movement suppression.

Returning `false` from `onEventMoveRequest` rejects a drop. Returning a created event from `onEventCreateRequest` lets the visible cache show the committed event immediately. Newly committed visible events briefly receive `status: "appearing"` in `renderEvent` props so product renderers can play a save/create highlight. For parent-owned save flows, update your own event store and call `commitVisibleEvent` so the loaded visible cache changes one record instead of reloading the range.

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

calendarRef.current?.restoreViewportAnchor({
  anchor: anchor,
  ...{
    target: {
      eventId: savedEvent.id,
      calendarId: savedEvent.calendarId,
      dateKey: savedEvent.start.slice(0, 10),
      time: "09:30"
    },
    afterRecenter: true,
    cancelOnManualScroll: true
  }
});
```

Capturing an event without `calendarId` resolves one mounted instance and records its actual participant id in
`anchor.target.calendarId`. Restore retains that identity instead of choosing another visible copy on each frame.
When toggling participants, capture a visible instance whose participant survives the change; prefer the previous
anchor's participant. If it is removed, capture a surviving participant before changing state and restore that same
instance. Keep the original edit anchor separately for Cancel. The demo's participant checkboxes use this policy and
retain browser focus while visual geometry settles.

Choose one restoration target for each editor transition. A date target preserves the displayed day; a resource/time
slot preserves a participant position. The following recipes describe those consumer policies.

For a consumer editor that must return to a day rather than a participant, store `getVisibleDateKeys()[0]` when
opening or clicking Save. After releasing the editor and its row filter, request the desired date position:

```tsx
calendarRef.current?.scrollToDate({ date: retainedDate });
calendarRef.current?.restoreViewportAnchor({
  anchor: { target: { dateKey: retainedDate }, snapshot: { top: 0, left: 0 } },
  afterRecenter: true,
  allowNavigationFallback: true,
  cancelOnManualScroll: true
});
```

Capture the clicked `request.renderedCalendarId` before opening an edit draft; hiding the saved source can change
collision geometry even when participants stay the same. The focused demo preserves the horizontal resource/time slot
on open and Cancel so expanding a compact card into a full-row editor does not scroll the grid. Capture an event with
`requireVisible: true` first to confirm the clicked instance exists, then capture and restore a slot without `eventId`:

```tsx
const target = { calendarId: request.renderedCalendarId, dateKey: date, time };
const visible = calendarRef.current?.captureViewportAnchor({
  ...target,
  eventId: request.event.id,
  requireVisible: true
});
const rowAnchor = visible ? (calendarRef.current?.captureViewportAnchor(target) ?? null) : null;
setActiveDraft({ mode: "edit", sourceEventId: request.event.id, event: request.event });
calendarRef.current?.restoreViewportAnchor({
  anchor: rowAnchor,
  target,
  afterRecenter: true,
  allowNavigationFallback: false,
  cancelOnManualScroll: true
});
```

The date-only target preserves horizontal scrolling. Navigation fallback can mount a day that left the rendered
window while the editor was open. Use `captureViewportAnchor({ dateKey })` to retain the day's current vertical offset
instead of aligning its header to the top. A new editor should cancel its preceding restore.

Before Cancel, capture the current draft's slot and restore against the original participant's slot after clearing
the draft. Hover changes only the card's presentation and cannot move a slot target. Keep the original slot anchor
as a fallback if that participant is removed. Clear the draft and request restoration in the same handler, without
a forced intermediate commit. The horizontal view retains the restore date while rows resize, even with
`allowNavigationFallback: false`; the date pin ends with the bounded restore or cancellation. Vertical editors and
participant changes can retain event targets. Drawn creation follows the same batching rule: set the controlled draft
and request its anchor restore in the same handler. Horizontal layout finishes measurements, restores the target,
and publishes both virtual windows before paint. Avoid forcing a draft-only commit between capture and restore.
Try drawing in Room 203 on October 17 with six calendars, then Cancel; the row should never leave its screen position.
Horizontal participant edits keep measured day sizes. Idle recentering waits while an explicit restore is active, then resumes
on the next scroll signal. Use `requireVisible: true` to reject missing or offscreen event instances; these captures
return `null` instead of falling back to a resource slot.

The target is semantic rather than lane-index based. If a save introduces collisions, participant changes, or new
metrics that move the event into another overlap lane, restoration resolves the new event geometry and keeps that event
at the captured viewport position.

For a row-preserving horizontal Save, capture a visible event before its resource/time slot, as above. If the draft
is offscreen, reuse the retained editor anchor rather than capturing its pinned offscreen coordinate. Restore the
saved participant's slot without `eventId` so collision lanes cannot move the row. Keep an offscreen restore alive
through navigation and deferred measurements:

```tsx
const visible = calendarRef.current?.captureViewportAnchor({
  ...target,
  eventId: draft.event.id,
  requireVisible: true
});
const current = visible ? calendarRef.current?.captureViewportAnchor(target) : null;
const anchor = current ?? retainedEditorAnchor;
calendarRef.current?.commitVisibleEvent({ event: savedEvent, appearing: true });
setActiveDraft(null);
calendarRef.current?.restoreViewportAnchor({
  anchor,
  target: { ...target, calendarId: anchor?.target.calendarId ?? savedEvent.calendarId },
  afterRecenter: !current,
  cancelOnManualScroll: true
});
```

Here `target` contains only the draft's `dateKey`, `time`, and `calendarId`; retain the opening anchor and refresh it
when visible geometry edits transfer the editor position. The focused demo uses this policy for Save in horizontal
view and retains event anchoring in vertical view. Try October 20 → Marco Eggens → scroll to December → Save.

Capture the source event before staging a move, update the controlled draft, then request restoration against the
proposed event in the same handler. Capture stays synchronous; restoration waits for the committed layout, so no
`flushSync` wrapper is needed. Retain that original anchor until the review ends. Accept can keep the proposed event at its
current viewport-relative position; Cancel should restore the same anchor against the original saved event (or the
original drawn slot for a create draft). Set `allowNavigationFallback: false` when the workflow must stay inside the
currently visible date and resource view.

Patch the saved event into the loaded visible cache before clearing the controlled draft:

```tsx
setEvents((current) => current.map((event) => (event.id === previousEventId ? savedEvent : event)));

calendarRef.current?.commitVisibleEvent({
  event: savedEvent,
  ...{
    previousEventId,
    appearing: true
  }
});

setActiveDraft(null);
```

If a parent-owned flow intentionally reloads through `eventVersion`, pass the committed ids in `appearingEventIds` so only those reloaded events receive the highlight once.

When cancelling a form, release the controlled draft before clearing parent state if the draft should fade out in place:

```tsx
calendarRef.current?.releaseActiveDraft({
  animation: "fade-out",
  durationMs: 420
});
setActiveDraft(null);
```

Repository example: the focused creation, visual-focus, and motion chapters in
[`ArticleDemos.tsx`](../../demo/guide/timeline/ArticleDemos.tsx) and
[`ArticleSystemDemos.tsx`](../../demo/guide/timeline/ArticleSystemDemos.tsx).

## Availability Editing

Availability uses normal events with `kind: "availability"`. By default it is a foreground event in `events` mode.
Set `renderLayer: "availability"` to paint it behind foreground events. In `events` mode, that background layer is
pointer-transparent. In `availability` mode, foreground cards remain visible but become pointer-transparent, and only
background-layered availability blocks participate in move/draw hit-testing.

Overlapping background-layered availability for one person or resource receives independent deterministic lanes. It uses vertical
mini-lanes in the horizontal calendar and side-by-side lanes in the vertical calendar. `renderEvent` receives the
availability lane through `lane`, its collision-group depth through `laneCount`, and collision state through
`isOverlapping`. Foreground events use a separate lane grid, and the resource grows to the greater of the two depths.

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
const [date, setDate] = useState<DateRange>({
  start: "2026-07-04",
  end: "2026-07-04"
});

<QunoDateInput
  expectedRange={{ start: "1900-01-01", end: "2100-12-31" }}
  selectionMode="single"
  value={date}
  onChange={({ value: next }) => {
    if (!next) return;
    setDate(next);
    calendarRef.current?.scrollToDate({ date: next.start });
  }}
/>;

<QunoInfiniteCalendar
  ref={calendarRef}
  {...calendarProps}
  settings={{ ...settings, zoom }}
  onZoomChange={({ zoom }) => setZoom(zoom)}
/>;
```

Date pickers, search results, command palettes, and “Today” controls can call the same handle without knowing the
calendar’s virtual-window geometry. Use `settings` for density and dimensions, then scope product CSS through
`className`; changing either preserves the same calendar integration and renderer contract.

For an editor that knows the resource row, supply its id while navigating the horizontal timeline:

```tsx
setSelectedCalendarIds(["provider-a", "room-1"]);
calendarRef.current?.scrollToDateTime({ date, time, calendarId: "room-1", align: "center" });
```

The package waits for the updated selection to commit before measuring the row. Multiple resource-row navigation requests in
one batch use the latest request. A later `scrollToDate`, explicit restoration, or cancellation also discards queued
row navigation. Use `align: "center"` when the row should move to the middle even if already visible. Centering follows
the live row height while async events settle within the existing bounded restoration session; manual scrolling cancels it. To start a new
draft where the operator is looking without scrolling:

```tsx
const visibleDates = calendarRef.current?.getVisibleDateKeys() ?? [];
const initialDate = visibleDates[Math.floor(visibleDates.length / 2)] ?? toolbarDate;
openCreateForm(initialDate);
```

Try **Use middle visible date** and **Show Room 1** in the date-navigation field-guide example. The former reads
the current viewport without moving it; the latter centers the selected resource row.

The optional target brings an offscreen or virtualized row into the unobscured viewport after the date mounts. An
already-visible row stays in place unless `align: "center"` is requested; the time still moves into view. Omitting `calendarId` preserves the original
date/time navigation, and the vertical view continues to navigate by date/time without a row axis.

Product controls do not need a separate submit step. The infinite-calendar demo uses `QunoDateInput` in single-date mode
and navigates to the committed day at its product-owned default focus time. It has no separate time field or Add event
action; creation begins by drawing on the timeline. Previous and next buttons can shift the controlled date and call the
same handle. Keep the five-minute time scale structure stable and let controlled zoom progressively reveal finer labels
instead of replacing tick nodes.

With the optional calendar stylesheet, readable time labels appear or disappear immediately at full opacity.
The grid switches directly to five-minute cadence above zoom 6 and back to quarter-hour cadence on zoom-out.
Hidden ticks keep their nodes with `display: none`. Both orientations use the same behavior without transparency effects.
Try Overview → Quarter hour → 5 minutes and back in the guide's **Reveal time progressively** chapter;
the controlled-zoom recipe above needs no additional animation state.

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

await calendarRef.current?.focusEvent({ event: event, ...{ preferredCalendarId: "room-1" } });
```

For controlled navigation, pass a unique request id. Re-rendering the same id does not repeat the focus operation.

```tsx
<QunoInfiniteCalendar
  {...calendarProps}
  focusRequest={{
    requestId: selectionVersion,
    event,
    preferredCalendarId: "room-1"
  }}
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
calendarRef.current?.commitVisibleEvent({
  event: saved,
  ...{
    previousEventId: updatedEvent.id
  }
});

await api.deleteEvent(saved.id);
calendarRef.current?.removeVisibleEvent({ eventId: saved.id });
```

These methods only patch loaded calendar cache. The parent remains responsible for persistence and for keeping future
`loadEvents` responses consistent.

`initialDateKey` sets the initial virtual range anchor. If omitted, the calendar starts around `now`. The same handle also exposes viewport anchoring helpers for parent-owned forms: `captureViewportAnchor`, `restoreViewportAnchor`, and `cancelViewportAnchorRestore`. `commitVisibleEvent` patches one saved event into the currently loaded visible cache. `releaseActiveDraft` lets a parent close controlled draft UI while the calendar keeps the last draft shell mounted briefly for a fadeout; `durationMs` controls both the retention window and fade duration.

The date range is bounded and recenters automatically without a consumer setting. Ordinary scroll pauses use a
1.2-second idle delay; reaching the absolute top or bottom uses a 240 ms delay so the next bounded range becomes
available sooner. Both paths preserve the visible date and its date-local pixel offset. Changing
`settings.excludedWeekdays` also preserves the current included date (or advances an excluded date to the next included
date) while the bounded date sequence and dense variable row measurements are rebuilt.

Horizontal slider or external prop zoom keeps a visible current-time marker stationary by default. If that marker is outside the viewport, horizontal scrolling uses the time at the center of the visible grid, while the timeline origin keeps its left edge stationary. `Shift` + wheel instead preserves the first time node nearest the pointer throughout the gesture. Both orientations commit time geometry and their scroll correction together before paint; a delayed controlled parent retains the old view until its new zoom commits. External zoom changes immediately take over the anchor. Vertical zoom also publishes final uniform date geometry and date/resource windows before paint, preserving the top date/time for slider changes. Zoom reprojects event-shell geometry without reloading events, rebuilding prepared overlap cells, or rerunning an unchanged external event renderer.

## Finding The Owning Implementation

When extending Infinite Calendar, start with its [responsibility-domain index](../infinite-calendar/domains/README.md).
Each domain document lists every owning source file and links to the detailed runtime flows. The other products use
their product `README.md` and `decisions.md` as their ownership index, so behavior should be added to its existing owner
rather than a generic hooks or utilities folder.

## Quno/Timepicker

Select a clock independently of a date. Import the control and optional stylesheet through its own subpath:

```tsx
import { useState } from "react";
import { QunoTimePicker } from "@quno/calendar/timepicker";
import "@quno/calendar/timepicker/styles.css";

function TimeField() {
  const [value, setValue] = useState<string | null>("10:30");
  return (
    <QunoTimePicker
      value={value}
      onChange={({ value }) => setValue(value)}
      enabledHours={[9, 10, 11, 12, 13, 14, 15, 16, 17]}
      minuteCadence={15}
    />
  );
}
```

For local state, supply `defaultValue="10:30"` and optionally observe `onChange`. Clear emits `null`. Omitted or empty hours
allow all 24. Sticky hours use larger, bold text (16px/700) beside regular-weight minutes (13px/400).
Cadence defaults to 15, with the same ten supported values as
Datepicker. Five-minute cadence lays out its 12 minutes as two rows of six choices. Settings changes preserve an existing clock, including times outside available slots. `disabled`
prevents choosing or clearing. Use labels, `formatters.time({ time, locale })`, class names, and
`--quno-time-picker-*` tokens for consumer-owned presentation. No date or parser is required.

Try `/guide/timepicker` and `/demo/timepicker`; see [the full contract](../timepicker/README.md).

Infinite Calendar consumers keep the same controlled zoom and renderer contracts. The runtime tracks native
scrolling independently from React presentation and reuses prepared layout during zoom; custom event content
continues to receive current geometry and interaction state.

For Infinite Calendar, supplying `onZoomChange` reserves wheel/trackpad samples with Shift held even at the zoom limits. Each nonzero sample changes zoom by 0.20 in either orientation. Native momentum scrolling is suspended while zoom input is captured. Shift keyup restores scrolling immediately; subsequent wheel input follows the current modifier state, so ongoing momentum may switch between scrolling and zoom. There is no gesture-lock delay or momentum detection. Shift-touch movement also suppresses panning.

Shift-wheel callbacks are paced by the previous accepted DOM/scroll commit. A delayed controlled parent receives the
latest accumulated target after that commit; no second request is issued while the first remains unacknowledged.
After one second without acknowledgment, queued input is discarded until fresh wheel input. External values remain
authoritative. No consumer-side forced React commit or paint acknowledgment is needed.

## Explore the demo concept

Run `npm run dev` and open `/concept`. Choose a product using the top tabs. Its floating guide starts with an
introduction; Next opens its first chapter. The contextual contents button opens every title inside that same guide. Choose a chapter
or use the footer arrows. The live demo starts automatically unless reduced motion is enabled and loops without
advancing navigation. Revisit a chapter to restart it. Click, drag, wheel, keyboard input, focus entering a working
control, or hiding the tab pauses playback and preserves the result. Mere pointer overlap does not pause it.

Drag the guide from its title, paragraphs or empty space. Buttons and links retain their usual actions. The chevron
collapses it to its title and expand button at the same width. Its left-bottom anchor stays in place as height
changes. Focus the guide and use arrows, Shift-arrows for larger steps, or Home to restore the bottom-left default,
24 px from each edge. On narrow Calendar scenes with controls, extra clearance keeps the footer reachable.

The bottom-right icon toggles fullscreen; Escape exits and restores focus to it. Escape from contents first returns
to the explanation. Fullscreen changes layout without remounting the working component. Other products sit right
of the guide on wide screens and in a scrollable region above it on phones. All previews remain interactive.

### Calendar chapters

Calendar introduces the author's rationale before eight chapters: infinite scroll, zoom, overlapping events,
horizontal/vertical, theming, event density, creation and rescheduling. JSON selects only the relevant compact
control, placed immediately left of fullscreen along the same bottom edge. No date/count or corner Saved/Moved
message appears. Ordinary schedules use 22 varied hour-long appointments at 2× zoom; density offers 4/40/400.

Scroll advances 900 px in one second, pauses two seconds and continues downward. Zoom moves 8 → the viewport-fitting minimum (at least 0.5), explores, then returns
to 8 and scrolls back. The explanation highlights Shift + scroll as a tag. Orientation switches also pan to the next
day. Theme ends in Light, density ends in Quiet/horizontal, rescheduling moves three appointments out and back, and
overlap moves outside all three cards for a closed hold. Creation checkpoints bound automatic edits per cycle.

Creation can set `initial.focusDraft: true`. Its controlled draft selects only that doctor's calendar ID while
`loadCalendarIds` retains all doctors. Save and Cancel restore selection with public viewport anchors. Drafts retain
creation/drag chrome, saved cards glint, and cancellation releases the draft with a fade. Saving/settled feedback is
consumer-owned presentation, not a new public status.

### Other products

Datepicker's seven chapters are Paint a range, Adjust the end, Move the range, Guess the intent, Access months,
Switch to start/end and Single day. Intent clicks one date three times: extend the range, choose the other endpoint,
then keep only that day. Month access opens the heading, scrolls back to July 1980 and selects 22 July as one day.
Its 8840 ms year scroll is twice its previous duration. Its single-day configuration is independent from range-focused chapters.
Paint alternates two ranges; Adjust extends then restores its endpoint; Move goes forward a week then back after a
pause. These scenes loop without clearing the picker. Intent hovering reveals the next interpretation before another click. Endpoint shortcuts visit
both ends without changing the range. Single-day mode belongs to its scene; no extra mode switch, hint or result
is shown below the picker.

Date Input uses today's date for relative phrases and a rolling expected period. Natural typing cycles through
“tomorrow”, “yesterday”, “22 July 1980” and “next Friday”. It holds each phrase for 1.2 seconds before Enter, then
shows the formatted result for 1.7 seconds. Keyboard editing steps the day down three times and the month up three times. Read the formatted result in
the field itself. Its reference-date label and raw recognition output are omitted. Timepicker keeps minutes smaller
than hour headings and top aligned. Date Parser remains an inspectable workbench with its fixed reference context.

### Edit scenarios in JSON

Edit `demo/concept/scenarios/<product-id>/<scenario-id>.json`: set `label`, `paragraphs`, `anchor`, `initial` and ordered
`steps`, then reference its ID in the product manifest's `scenarios` array. Calendar allows three paragraphs; other
products allow two. Existing action types need no player changes. Calendar and Datepicker `loop: "continue"` preserve authored
cycles without resetting the component; other scenes restore their initial configuration between passes. See the
[authoring instructions](../../demo/concept/README.md#edit-scenarios-in-json). No public API migration is required.

In `/concept`, Works with datepicker uses the focused composition recipe above: focusing the input opens the picker,
internal selection keeps it open, and outside focus or pointer interaction closes it. Natural typing accepts ranges;
range completion is offered only in range mode.

The Timepicker concept includes the single-day Datepicker time-mode flow above, returning from minute selection to
days and retaining both values. Date Parser’s concept renders tokenizeDateInput tokens before parseDateInput
endpoints with the same recognizeTime option, so changing a phrase shows both its parts and result.

The Date Parser concept keeps preferred order and clock recognition in scene JSON. Its visible workbench shows the
phrase, reference, tokens and resolved endpoints without configuration controls or a structured-result disclosure.

Date Parser’s introduction holds `12/01 10:00` already recognized. Choose Resolve a phrase to start its six examples,
including a clock, rolling duration, written date and explicit range. Scene `chapterOnly: true` preserves the ready
initial control during introduction arrival/restoration; other products retain their existing behavior.

The guide footer has only Previous and Next. Use All calendar demos (or the current product label) above the title
to open contents. Its 34 px height matches collapse. Calendar scene docks are 40 px high, matching fullscreen, and
keep only the controls. In creation, drag the active draft to update its editor, then Save or Cancel normally.

Selecting a visible time option keeps the list in place. The shared Timepicker/Datepicker renderer reveals its
initial hour and later offscreen values, while equivalent enabled-hour arrays do not reset manually chosen scroll.

The concept shell and canvas follow live system appearance. The explainer and non-calendar controls retain their
light styles on bright panels. Calendar defaults to the system palette except for its explicit Theming chapter.
Zoom controls use the calendar's viewport-fitting horizontal minimum (0.5 vertically) and maximum 8, updating on
resize and orientation changes. These choices belong to the demo; consumer styles and public defaults are unchanged.
