# Calendar V2 Architecture

The calendar is a reusable rendering library first and a demo application second. Interface vocabulary follows the
[Interface Taxonomy](./taxonomy.md); maintained responsibility maps and execution sequences live in
[`docs/domains`](./domains/README.md) and [`docs/flows`](./flows/README.md).

```mermaid
flowchart LR
  Public["CalendarRoot public facade"] --> Runtime["shared view runtime"]
  Runtime --> Cache["bounded async cache"]
  Runtime --> Viewport["date and resource windows"]
  Runtime --> Gestures["pointer and zoom controllers"]
  Cache --> Cells["indexed prepared cells"]
  Cells --> Projection{"horizontal or vertical projection"}
  Viewport --> Projection
  Gestures --> Projection
  Projection --> Layers["memoized render layers"]
  Layers --> Renderer["external eventRenderer"]
```

The central performance rule is simple: network work can add or refresh event shells, but it never owns the grid.
Dates, resources, scrolling, sticky labels, zoom, hit-testing, and drafts render from settings and the last cache
snapshot without awaiting `loadEvents`. The runtime is designed for schedules ranging from roughly four to hundreds of
events per day and targets smooth 60–120fps scrolling. That frame-rate range is an engineering target, not a guarantee
across every browser, device, viewport, data shape, or consumer-provided event renderer.

The demo wraps its fixture range loader with a `POST /api/demo-events` mock transport: a Vite middleware serves local
development and preview, while a root `api/` Web handler serves Vercel deployments. Both exist to make latency,
cancellation, and concurrent requests observable in browser tooling; neither is part of the package or its runtime
dependency graph. Vercel publishes the separately built `dist-demo` application and applies an SPA fallback after
filesystem and function routing.

## Runtime Flow Atlas

The overview below defines ownership and dependency direction. Concrete trigger-to-render stories are decomposed into focused guides so each async boundary, correction, and cancellation path can be followed independently.

```mermaid
flowchart LR
  Trigger{"Runtime trigger"} --> Async["API response or invalidation"]
  Trigger --> Scroll["scroll, navigation, or recenter"]
  Trigger --> Pointer["draw, drag, activate, or cancel"]
  Trigger --> Zoom["slider or Shift + wheel"]
  Async --> AsyncGuide["Async loading and late layout guide"]
  Scroll --> ScrollGuide["Virtual scroll and recenter guide"]
  Pointer --> InteractionGuide["Interactions and zoom guide"]
  Zoom --> InteractionGuide
```

- [Flow guide and anchor taxonomy](./flows/README.md)
- [Async loading, cache commits, and late metric focus](./flows/async-loading-and-layout.md)
- [Virtual scrolling, navigation, measurement, and recentering](./flows/virtual-scroll-and-recenter.md)
- [Pointer interactions, mutation outcomes, and zoom subflows](./flows/interactions-and-zoom.md)

## Public Surface

`CalendarRoot` remains the package entrypoint. It accepts calendars, selected calendar ids, a range loader, an optional `eventPrefetchPolicy`, an external renderer, controlled settings, interaction callbacks, and an optional imperative ref.

- `view="infinite-horizontal"`: dates flow down, calendars are rows, time runs left-to-right.
- `view="infinite-vertical"`: dates flow down, calendars are columns, time runs top-to-bottom.
- `view="infinite"`: compatibility alias for the horizontal view.

Date-header text is also settings-owned. `settings.dateLocale` flows directly to the date-label formatter in both
orientations, while `settings.dayNameGenerator` can replace the complete displayed label without changing date
virtualization or date-key identity. Generated vertical labels use one primary line; default vertical labels retain
their month/day and weekday lines. When no locale is supplied, `Intl.DateTimeFormat` uses the current runtime locale;
server-rendered applications should pass an explicit locale when server and browser defaults may differ.

`LoadEventsArgs` includes `signal?: AbortSignal`; existing loaders remain valid and cancellation-aware loaders can stop obsolete requests early. `eventPrefetchPolicy` receives the rendered date keys and selected calendar ids and returns `{ beforeDays, afterDays }`. The exported `defaultEventPrefetchPolicy` requests seven calendar days before the first rendered date and seven after the last rendered date.

`CalendarRoot` also coordinates declarative `focusRequest` values and imperative `focusEvent` calls above both
orientation views. A focus request contains a complete event, asks the parent to reveal all known participant calendars
through `onCalendarVisibilityRequest`, and asks the selected view whether the preferred event shell is fully inside its
uncovered content viewport. A fully visible target is highlighted without a scroll write; a clipped or offscreen target
uses date/time navigation or geometry restoration to enter the view. A target on a weekday removed by
`settings.excludedWeekdays` resolves unavailable before navigation, because no event instance can exist in that date
model. `removeVisibleEvent` deletes one id from the loaded date cache; neither focus nor deletion persists data. When
the preferred participant instance is already visible, subsequent focus requests use that same local instance and
remain idempotent.

## Dependency Direction

```mermaid
flowchart TD
  Entry["foundation: facade, types, date, time"] --> Scroll["scroll"]
  Entry --> Events["events"]
  Entry --> Interactions["interactions"]
  Scroll --> Anchors["anchors"]
  Events --> Anchors
  Interactions --> Anchors
  Entry --> Rendering["rendering"]
  Scroll --> Rendering
  Events --> Rendering
  Anchors --> Rendering
  Scroll --> Views["orientation views"]
  Events --> Views
  Interactions --> Views
  Anchors --> Views
  Rendering --> Views
  Views --> Shell["EventShell geometry boundary"]
  Shell --> External["consumer eventRenderer"]
  Demo["demo and examples"] --> Entry
```

Feature domains do not import views or demo code. Scroll publishes visible positions; events decides what to prefetch. Anchors translate semantic focus using scroll and event geometry without becoming part of either engine. Product card markup stays outside the library internals: rendering positions `EventShell`, then calls `eventRenderer` with event, status, lane, overlap, and full-size style data.
Each `EventShell` is also a named `calendar-event` size container. Product renderers can therefore adapt their content
hierarchy to the shell's own width and height with CSS container queries, without viewport media queries or
layout-measurement state in React.

Primary ownership folders are:

- `src/lib/core`, `date`, `time`, and `data`: public facade and foundation primitives.
- `src/lib/infinite/scroll`: bounded date windows, visible position, settlement, navigation, and resource windows.
- `src/lib/infinite/events`: loading, cache, indexing, overlap layout, and metrics.
- `src/lib/infinite/anchors`: parent, late-data, and zoom visual-focus restoration.
- `src/lib/infinite/interactions`: pointer, hit-testing, drag, draft, and wheel-zoom state.
- `src/lib/infinite/rendering`: shared/orientation DOM layers, geometry, and styles.
- `src/lib/infinite/views`: horizontal and vertical composition roots.
- `demo/app`: application entrypoint and the retained showcase routes.
- `demo/examples`: the single documented public-API field guide and its recipe-sized live exhibits.
- `demo/showcase`: application-only presets, dense stress data, and product-style interactions.

[`docs/domains`](./domains/README.md) documents the library ownership contracts and source map.
[`docs/flows`](./flows/README.md) documents execution order. [`demo/examples`](../demo/examples/README.md) documents the
consumer field guide. Folder names are the source-level ownership signal; `check:architecture` enforces readable
module/function sizes and keeps demo code outside the library.

The `/examples/integration-walkthrough` route owns the complete example surface. It owns a document-height article
scroller and table of contents, mounts later calendar exhibits only when they approach the viewport, and keeps
each exhibit mounted afterward. Every exhibit uses the same demo-owned full-screen shell, which places its existing
mounted `CalendarRoot` in a fixed viewport overlay; it does not invoke the browser Fullscreen API or move calendar state
into the reusable library. Its system-design labs also expose two existing library boundaries without adding article
state to the runtime: `interactionMode` switches pointer ownership between committed event and availability layers, and
the public viewport-anchor handle carries visual focus from a controlled draft to its saved replacement or through
overlap-lane recomputation. A CSS-native lab demonstrates that sticky days and resource names remain browser-positioned
instead of entering high-frequency React scroll state. Product-control labs use the existing navigation handle,
controlled settings, and scoped `className` styling. Date/time fields navigate immediately, adjacent-day controls call
the same handle, and a progressive-precision lab changes only controlled zoom while the existing stable tick DOM reveals
readable minute labels. A final composition demonstrates those boundaries together without adding an article-specific
library surface.

## Async Event Loading

```mermaid
sequenceDiagram
  participant V as Viewport
  participant C as Range coordinator
  participant A as Async API
  participant I as Date/event index
  participant R as React view

  V->>C: visible and overscan date keys + prefetch policy
  C-->>R: return current cache snapshot immediately
  C->>C: expand warm window and split missing ranges
  C->>A: loadEvents(missing range, calendarIds, signal)
  Note over R,A: grid and interactions remain live
  alt viewport, loader, selection, or version changed
    C->>A: abort obsolete request
    C->>C: reject stale generation responses
  else request fails
    C->>A: retry after 250 ms, then 1 s
  else current response succeeds
    C->>I: deduplicate and index affected date buckets
    I->>I: protect warm-window dates and trim LRU to 120 dates
    C->>R: transition to new snapshot
  end
```

### Unloaded Date To Late Height Commit

Navigation never waits for event data. The grid first paints compact rows for the requested date. If the accepted response later introduces dense overlaps, the calendar captures a grid-owned data-layout anchor, resizes only affected dates, and translates that anchor through the new row prefix extents before paint.

```mermaid
sequenceDiagram
  actor User
  participant Nav as Date/time navigation
  participant View as Calendar viewport
  participant API as Delayed API
  participant Layout as Membership and overlap layout
  participant Anchor as Data-layout anchor
  participant Virtual as Date virtualizer

  User->>Nav: scrollToDateTime(D, T)
  Nav->>View: paint D immediately at base row heights
  Nav->>View: keep time T on the horizontal axis
  View->>API: request visible/overscan range
  Note over View,API: scrolling, zoom, hit-testing, draw, and drag remain live
  API-->>Layout: accepted events arrive later
  Layout->>Layout: prepare lanes and revised row/day metrics
  View->>Anchor: capture header or {D, resource, offsetWithinRow}
  Anchor->>Virtual: resize affected date items
  Virtual-->>Anchor: revised date prefix positions
  Anchor->>View: restore semantic slot before paint
  View-->>User: events appear without taking DOM or visual focus
```

The resulting focus contract is explicit:

| View state before response                   | Position preserved after response                                                  |
| -------------------------------------------- | ---------------------------------------------------------------------------------- |
| Exact `scrollToDate(D)`                      | D's date header; dense rows grow downward.                                         |
| `scrollToDateTime(D, T)`                     | The same date policy vertically and time T horizontally.                           |
| Viewport partway inside resource R on date D | `{ D, R, offsetWithinRow }`; growth above R is compensated.                        |
| Anchored resource removed by another change  | Captured date-local fallback offset, clamped inside D.                             |
| Vertical orientation receives dense overlaps | Date/time Y stays fixed; overlap changes column width rather than vertical height. |

The anchor targets stable grid semantics, never a newly arriving event. The full request, failure, transaction, orientation, and invalidation subflows are in [Async Loading And Layout](./flows/async-loading-and-layout.md).

Important invariants:

- A refresh invalidates loaded-date knowledge, not the rendered cache, so delayed requests do not blank events.
- Abort signals are advisory; generation checks also protect against loaders that ignore cancellation.
- Event ids are deduplicated globally inside cached buckets.
- Moves and visible commits use the event-id index to patch only source/destination buckets.
- Appearance timers are independent per event.
- Empty or failed requests do not change grid geometry.

## Prepared Cell Pipeline

Each revised date is indexed by calendar membership in one pass. Each date/calendar cell separates availability from timed events and prepares overlap lanes with a deterministic heap-based `O(n log n)` algorithm.

```mermaid
flowchart LR
  Events["date events"] --> Membership["calendar membership index"]
  Membership --> Cell["date/resource cell"]
  Cell --> Availability["availability records"]
  Cell --> Prepared["prepared timed intervals and lanes"]
  Prepared --> Metrics["row height or column width"]
  Prepared --> Horizontal["horizontal rectangles"]
  Prepared --> Vertical["vertical rectangles"]
  Prepared --> Hit["hover and hit geometry"]
```

Late data produces a bounded measurement feedback loop; it does not restart the whole calendar:

```mermaid
flowchart LR
  Response["accepted date buckets"] --> Membership["membership index"]
  Membership --> Lanes["prepared overlap lanes"]
  Lanes --> RowMetrics["affected row heights"]
  RowMetrics --> DayMetrics["affected date heights"]
  DayMetrics --> Capture["capture visible semantic slot"]
  Capture --> Resize["resize affected virtual dates"]
  Resize --> Translate["translate date/resource/local offset"]
  Translate --> Paint["paint event shells in stable viewport"]
```

Sizing and rendering reuse the same prepared cell. Availability remains a full-cell background layer and never increases overlap metrics. One shared state layer assigns availability, draft, and drop-preview statuses; horizontal and vertical views provide their own geometry adapters. These overlays never perturb committed layout.

## Date And Resource Virtualization

The date scrollbar represents a bounded month-before/month-after window. Only viewport dates plus five date sections
of overscan on each side are mounted. Ordinary scrolling uses a 1.2-second idle deadline; reaching the absolute top or
bottom uses a 240 ms edge deadline so the bounded range extends before the user waits at a hard stop. When either
deadline settles, the top visible date becomes the next window anchor while its exact intra-day pixel offset is
preserved. When `excludedWeekdays` changes, the calendar rebuilds the included-date sequence from the semantic top date
instead of reusing the old raw scroll offset. Horizontal variable day measurements receive a settled second alignment
after their date keys have been replaced. If a controlled draft is opening or closing during another structural
change and its date is already in the virtual viewport, that date remains the structural focus until the parent
event/slot anchor finishes the exact row correction. An offscreen draft does not replace the user's visible date.

```mermaid
stateDiagram-v2
  [*] --> Centered
  Centered --> Scrolling: scroll or scrollbar drag
  Scrolling --> Waiting: scroll event or scrollend
  Waiting --> Scrolling: more movement
  Waiting --> Snapshot: idle deadline
  Snapshot --> Deferred: pointer interaction active
  Deferred --> Snapshot: interaction ends
  Snapshot --> Recenter: capture date and intra-day offset
  Recenter --> Centered: rebuild bounded window and restore offset
```

The cross axis has its own resource window:

- Horizontal dates mount only intersecting calendar rows plus two rows of overscan on either side.
- Vertical dates mount only intersecting columns plus two columns of overscan on either side.
- Prefix extents preserve the full row/column spacer geometry; skipped resources never compact the layout.
- Active draft, drop-preview, and active viewport-restore target resources are pinned even when outside the ordinary cross-axis window. Event timestamps are mapped through the canonical local-date helper before choosing either a date or resource pin; raw UTC string prefixes never drive calendar membership.

Async event metrics use a separate one-commit data-layout anchor; they do not replace the bounded virtual-window anchor. The concrete scroll-event, idle timer, pending target, window rebuild, and restore sequence is documented in [Virtual Scroll And Recenter](./flows/virtual-scroll-and-recenter.md).

## Pointer And Zoom Runtime

The viewport uses one Pointer Events pathway. Pointer ownership comes from the mounted grid's date and resource metadata, so a just-measured variable row cannot be mistaken for a neighbor when async data changes layout. Resource cells add local hover resolution, while the shared controller owns press, draw, drag, completion, rejection, callback failure, pointer cancellation, and Escape cancellation.

Interaction callbacks are capabilities, not only completion notifications. Empty-grid drawing starts only when
`onEventCreateRequest` or `onEventDraftRequest` exists. Persisted event dragging/activation starts only when
`onEventMoveRequest` or `onEventActivate` exists, and controlled drafts are draggable only with
`onActiveDraftMoveRequest`. Unsupported gestures stay idle rather than creating an interaction that cannot commit.

```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> Pressing: pointer down in timeline grid
  Pressing --> Drawing: empty grid movement
  Pressing --> Dragging: event movement
  Pressing --> Activating: click without drag
  Drawing --> Committing: pointer up
  Dragging --> Validating: pointer up
  Validating --> Idle: accepted and cache patched
  Validating --> Idle: rejected or callback throws
  Committing --> Idle: created, external draft opened, or callback throws
  Pressing --> Idle: pointercancel or Escape
  Drawing --> Idle: pointercancel or Escape
  Dragging --> Idle: pointercancel or Escape
  Activating --> Idle
```

Hit-testing rejects sticky labels and headers. Multi-calendar hover remains local to one rendered resource instance; drag and preview status stays keyed by event id across instances.

Zoom stays controlled by `settings.zoom`. `Shift` + wheel requests `onZoomChange`, keeps the first focused time node for a gesture burst, and restores scroll on an animation frame. Slider or other external horizontal zoom changes first preserve a visible current-time marker at its viewport position in a layout effect before paint. When the marker is outside the configured hours or viewport, a horizontally scrolled view preserves its grid-center time and the timeline origin preserves its left edge. The wheel path suppresses that generic correction and retains its pointer-specific anchor. Horizontal rendering may apply a viewport-fill zoom floor without mutating the parent-owned value.

The showcase keeps the controlled projection value and displayed control value in separate narrow contexts. A gesture zoom request updates only the calendar wrapper immediately; the range thumb and numeric readout catch up once after the 300ms gesture tail. Direct slider input updates its thumb/readout immediately and coalesces calendar projection to the latest value once per animation frame. The route shell, settings sections, popup, and other demo controls do not render again. The calendar shell owns a stacking boundary but deliberately avoids broad paint containment around its changing scroll surface; its existing overflow clip still bounds visible content without encouraging mixed old/new raster tiles during rapid zoom. The zoom control and live stats panel own small local layout, paint, and compositor boundaries. The full control pane must not use paint containment: a changing child would otherwise invalidate the full-sidebar paint layer despite stable React and DOM identity. The static sidebar is isolated on a parent compositor layer, and its changing child layers rerasterize independently, so neither a calendar frame nor a settled zoom-output update clears and repaints the menu surface.

The default showcase activity pane retains the six most recent parent/demo lifecycle messages instead of replacing the
previous message. External-popup cancellation adds a second entry describing whether viewport scroll restoration was
requested for the original event/drawn slot or skipped because no anchor was captured. This instrumentation remains
demo-only and does not add a reusable calendar callback. A demo-owned observer coalesces viewport scroll bursts after
180ms: recent wheel, touch, scroll-key, or scrollbar intent is reported as `Viewport scrolled`, while navigation,
virtual-window recentering, and anchor corrections without recent manual intent are reported as
`Viewport repositioned`.

Time scales keep a stable five-minute DOM skeleton across every zoom level. Coarser zooms hide minor labels without removing their nodes or text, while a single horizontal or vertical percentage track absorbs the changing timeline extent. Crossing the fine-grid threshold therefore changes label visibility and grid cadence without inserting a burst of tick elements across the visible dates.

### Zoom Stability Rules

Zoom is a geometry update, not a calendar-content lifecycle. Changes in `settings.zoom` must follow these rules:

- Never key the calendar, a date, a resource row or column, an event shell, or time ticks by zoom. Mounted semantic nodes must retain identity while their position and size styles change.
- Keep controlled zoom state as close as possible to the calendar and its zoom input. Unrelated application chrome, settings, popups, and data controllers must not subscribe to it.
- Do not write sidebar control DOM on every gesture frame. Keep wheel/touch projection immediate, then synchronize its thumb and readout once the gesture settles. Direct slider display stays immediate while its calendar projection is limited to the latest value once per animation frame.
- Keep prepared membership, overlap, and resource metrics independent of zoom. An unchanged external `eventRenderer` must not run again merely because its event shell moved or resized.
- Keep tick cadence in the DOM independent of visual grid cadence. Hide labels with attributes/classes; do not add, remove, or replace label children at a zoom threshold.
- Apply scroll-anchor correction in a layout effect before paint. Do not blank, fade, skeletonize, or remount the calendar during correction.
- Accumulate raw mouse-wheel and touchpad zoom steps within a display frame, then perform one controlled projection and anchor restore using the first focused node. A newer external controlled value must cancel the queued wheel commit.
- During a vertical day-height change, render the semantic top-date window from the new uniform base-day geometry until virtualizer measurements settle. Never expose a window selected from the new scroll offset and stale item sizes.
- Isolate calendar stacking without applying broad paint containment to the changing scroll surface. Put frequently changing neighboring controls in the smallest practical paint boundary; never use a full menu or sidebar paint boundary for one changing value. Keep stable adjacent chrome on its own compositor layer when continuous calendar reprojection would otherwise share a raster surface with it.
- Any zoom rendering change must update the Playwright continuity coverage with DOM-identity or child-list-mutation assertions plus geometry/anchor assertions. Screenshot comparison alone is not sufficient.

## Render Layers

```mermaid
flowchart TB
  Chrome["date, resource, time, and grid chrome"] --> Availability["availability layer"]
  Availability --> Committed["prepared committed event layer"]
  Committed --> Draft["controlled or drawn draft layer"]
  Draft --> Preview["drop-preview layer"]
  Preview --> Marker["current-time and sticky label layers"]
```

Layers share prepared geometry but have separate interaction rules. `EventShell` is memoized and owns position, z-index, state classes, CSS variables, and geometry registration. Its product-card child is memoized separately, so zoom can update shell coordinates without reinvoking the external renderer. Membership indexes, prepared lanes, row metrics, and column metrics likewise exclude zoom from their memo dependencies because zoom changes projection pixels rather than event relationships.

## Viewport Anchoring

Every mounted day, resource, and event instance registers with an instance-scoped geometry registry. Anchoring never searches the document with global selectors. Event unregisters carry the element they previously owned, so an old date instance unmounting cannot delete a replacement event that already registered under the same event/calendar key.

```mermaid
sequenceDiagram
  participant P as Parent flow
  participant G as Geometry registry
  participant S as Restore scheduler
  participant V as Viewport

  P->>G: capture event or date/resource/time target
  G-->>P: viewport-relative snapshot
  P->>P: change participants, draft, or saved data
  P->>S: restore snapshot to target
  S->>G: resolve current registered geometry
  S->>V: one scheduled scroll correction
  G-->>S: notify mount or layout changes
  S->>V: correct while within deadline
  V->>S: manual pointer, wheel, touch, or key intent
  S->>S: cancel when requested
```

One mutation observer, one resize observer, registry notifications, and one animation-frame slot replace selector polling and timeout ladders. Restores that opt into `cancelOnManualScroll` cancel synchronously on pointer, wheel, touch, or scroll-key intent so a queued correction cannot consume the user's first movement. Navigation fallback remains available when a target is not mounted.

Event focus is a transient coordinator above this primitive. It requests the complete controlled calendar selection,
then tests the preferred participant instance against the content viewport after sticky headers and labels are
excluded. A fully visible shell receives `status: "focused"` without scrolling; only a clipped or offscreen shell is
restored or navigated into view. The focused key is `{ eventId, calendarId }`, so only one multi-calendar instance
receives the status. Request ids are processed once; a newer request or manual input cancels older work.

Anchor names describe different owners rather than interchangeable snapshots: parent viewport restore, active gesture, pending navigation, automatic data-layout correction, and idle virtual-window recenter. Higher-priority owners suppress lower-priority scroll writes. See the [anchor taxonomy and priority diagram](./flows/README.md#anchor-taxonomy).

## Styling And Packaging

Native CSS sticky positioning owns date, resource, and time labels. The sticky time-scale stacking context sits above
per-day header marker segments, so its opaque header and pin expose only the marker stem below the circle while sticky
date/resource labels remain above both. Reusable CSS is split into base, horizontal, vertical, and event-shell ownership
files.

Package builds emit JavaScript and an explicit `quno-calendar/styles.css`; JavaScript does not inject CSS or access `document` during import. Both ESM import and CommonJS `require` are safe in Node/SSR environments. Library date parsing and labels use small local/`Intl` helpers, so `date-fns` is not a runtime dependency of consumers.
