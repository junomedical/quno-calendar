# Quno/Infinite Calendar decisions

## QUNO-001 - Consolidate calendar, picker, and natural input

- Date: 2026-08-24
- Status: Accepted; supersedes only the pending `infinite-calendar` package rename
- Context: The timeline and date-selection libraries had separate packages, guides, framework conventions, and release workflows despite sharing calendar-day contracts and consumer use cases.
- Decision: Publish one React-authored `@quno/calendar` package with independent `timeline`, `date-picker`, and `date-input` UI subpaths, a headless root, optional feature styles, official tested Preact compatibility aliases, and one `/guide`. Keep picker day arithmetic timezone-free and keep timeline event timestamps local/offset-aware.
- Consequences: Consumers install one package and can import any feature independently. The release is breaking and has no compatibility exports. Historical calendar decisions below and all accepted datepicker-family decisions in [the QDP ledger](../datepicker/decisions.md) remain authoritative.

## 001 - Greenfield Vite React TypeScript

Vite keeps the PoC lightweight while still supporting strict TypeScript, Vitest, and Playwright.

## 002 - View Components Behind QunoCalendar

The root component owns shared calendar inputs and delegates rendering to view components. This keeps future day/week/resource views possible without rewriting event renderers.

## 003 - Async Range Loader

The infinite view requests a bounded window around rendered dates rather than requiring all events upfront. Its default prefetch policy keeps one calendar week warm before and after the rendered dates, and consumers can replace the policy for their own latency and navigation profile.

## 004 - Parent-Validated Mutations

Drag/drop previews are local, but accepted data changes must come from the parent through callbacks. This keeps persistence, permissions, and conflict rules outside the rendering component.

Accepted move proposals also patch the calendar's loaded visible buckets after parent validation. Parent demos still persist the move into their source event arrays, but they do not bump `eventVersion` for accepted moves because that would clear the same visible range the calendar already patched and produce a full redraw.

## 005 - Renderer Receives Event Status

The event renderer handles `existing`, `hovered`, `drop-preview`, and `new` states. This lets product-specific appointment cards render all interaction states without depending on calendar internals.

## 006 - Controlled Zoom Changes

Zoom remains parent-controlled through settings, and the infinite view requests changes with `onZoomChange`. This keeps wheel gestures, sliders, and any future external zoom controls synchronized without making the view own application state. The PoC slider and built-in wheel gestures clamp their control range to `0.5-8`, while the calendar preserves lower incoming prop values and applies pixel lower bounds during rendering. External horizontal zoom preserves a visible current-time marker by default, then falls back to the visible grid center or the timeline origin when that marker cannot anchor the viewport. `Shift` + wheel anchors to the rendered time-grid node nearest the mouse, clamped to the configured timeline bounds, so zooming feels aligned to the visible timeline structure rather than an arbitrary fractional minute. A multi-event wheel burst keeps the first focused node instead of reselecting a nearby hour on every tick. Immediate trackpad wheel momentum can continue briefly after Shift is released, so the zoom handler captures a short non-extending gesture tail and prevents those first trailing events from becoming ordinary calendar scroll. Delayed scroll restores are versioned so older wheel ticks cannot rewrite scroll after newer inertial ticks or cancellation-tail events. Horizontal rendering also has a viewport-fill floor so the board does not shrink below the available scroll viewport width even when the controlled zoom value is lower. High zoom should reveal finer timing, so the grid and time labels switch from 15-minute to 5-minute cadence only after zoom is greater than `6`.

## 007 - Sticky Labels Use Native CSS

The top time scale and per-day date labels use native CSS sticky positioning. Date labels stick on both the top and left axes, while calendar row labels stick on the left axis. This keeps labels visible during vertical and horizontal virtual scrolling without extra overlay synchronization.

## 008 - Documentation Is Part of Each Behavioral Change

Behavioral and API changes must update the relevant Markdown files: architecture/API notes, usage examples, decision log, test plan, and changelog. `AGENTS.md` records this as an implementation rule for future agent work in the PoC.

## 009 - Created Drafts Update The Visible Cache

The infinite view keeps a loaded visible-range cache, so parent state changes alone may not be visible until a reload. After `onEventCreateRequest` resolves, the view inserts the returned created event, or a local draft copy, into the loaded date bucket so the new event appears immediately. Parent-owned flows such as external popup save should update their canonical data and call `commitVisibleEvent` to patch the single saved record into loaded visible buckets; they can still bump `eventVersion` when a broader event-store reload is required. Loaded date buckets are keyed by event id on merge so repeated backend records cannot incorrectly add overlap lanes.

Newly committed events receive a short-lived `appearing` renderer status when they first enter the loaded visible cache through immediate create, through `commitVisibleEvent(..., { appearing: true })`, or through parent-provided `appearingEventIds` during an `eventVersion` reload. Requested appearing ids are consumed once while the request remains active, so later range responses or reloads do not replay the same glint. Initial range loads, selected-calendar refetches, and unrelated reloaded records do not mark existing events as appearing. The demo renderer uses that status for a hard-edged diagonal white glint, while product renderers own their own visual treatment.

The default demo does not invalidate the visible range after external save. It updates parent event data, commits the saved event into the current loaded cache with `appearing`, then clears the controlled draft. This avoids the save-time blank range, duplicate draft/committed glints, and follow-up range-reload jump.

External save restores its captured viewport anchor with immediate correction only and `cancelOnManualScroll`, not the delayed after-recenter correction sequence. This prevents save completion from pulling the viewport back after the user starts scrolling.

## 010 - Current-Time Marker Uses The Timeline Coordinate

The sticky top pin and per-day current-time lines use the same natural timeline x-position. This keeps the red marker connected and moving at the same rate as the time grid when the timeline is horizontally scrolled.

## 011 - Events Can Belong To Multiple Calendars

Events support optional `calendarIds` in addition to the backward-compatible `calendarId`. The infinite view renders one instance in each matching selected calendar row. Hover focus is local to the row instance under the pointer, while drag and drop-preview state is keyed by event id so all visible instances move together.

## 012 - Row Labels Are Neutral, Event Cards Carry Color

Calendar row labels do not use colored left strips. Event cards carry the color code with a thicker left border via `--event-accent`, and standard card backgrounds use the derived `--event-accent-muted` so the fill is a softer version of the same hue. This better matches the reference appointment-card design and keeps resource labels visually quieter.

## 013 - Dense Overlaps Grow Rows

Compact rows default to 50px. One or two overlap lanes keep that compact height; rows grow on a fixed ladder starting at three lanes. The final height is also clamped to at least 24px per dense overlap lane. Resting event shells are inset 2px from the top and bottom of their mini-lane, so dense event shells stay at least 20px tall and neighboring resting lanes do not touch. Hovered event shells expand to the full calendar row lane height with a higher z-index, matching the interaction design where the focused appointment becomes readable without permanently resizing the row.

## 014 - Date Headers Overlay The Time Scale

The time scale is sticky only on the top axis. Day date headers are sticky on the top axis, but only the left date label stacks above the time scale; the full-width gray day band stays below it so hour and minute labels remain visible. The time-scale stacking context also sits above per-day current-time header segments, preventing a red stem from appearing above the global pin while retaining the marker through lower day headers. Calendar row labels stack above horizontally scrolled timeline content. This lets native CSS sticky positioning make left labels cover scrolled timeline content instead of using JavaScript-driven clipping.

## 015 - Demo Data Is Spread Across All Calendars

The deterministic generator assigns each event to two calendars chosen from the full demo calendar set. This prevents large dataset scales from clustering into a few rows, proves multi-calendar rendering across doctors and rooms, and keeps the 5,000 and 20,000 events/year smoke tests representative.

## 016 - Row Growth Is Local

Overlap-driven height growth is calculated for each rendered date/calendar row, not as a global maximum over the loaded event cache. The virtualizer keeps a cheap base day-height estimate and measures rendered day elements for variable heights. Pointer hit-testing uses the measured virtual day item plus row-local heights so drag, drop, and draft creation stay aligned with the visible layout.

## 017 - Availability Is A Background Event Layer

Availability is represented as `kind: "availability"` on normal calendar events so product renderers can use the same external rendering contract. The infinite view renders availability at full row height behind regular events, excludes it from overlap and row-height calculations, and makes its shell pointer-transparent so event creation can happen on top.

## 018 - Current Time Uses Live Input And Top Marker Priority

The demo passes live system time to the calendar rather than a fixed fixture timestamp. The time marker uses the same timeline coordinate for the sticky pin, header segment, and day lines, with a higher visual layer than events so it remains visible as a tracking line.

## 019 - Editing Mode Selects The Active Layer

The calendar uses `interactionMode` to decide which event layer receives pointer interactions. Appointment mode keeps availability as background context. Availability mode flips that behavior so availability can be moved or drawn while appointments stay visible but inactive. This avoids adding separate calendar hit areas for availability editing and preserves the external event renderer contract.

## 020 - Demo Appointments Respect Availability Windows

The deterministic demo now generates recurring weekday availability windows per calendar, with provider calendars using distinct windows. Appointment generation chooses a weekday with availability for the primary calendar and places the appointment inside that window, so large datasets demonstrate availability-constrained scheduling instead of arbitrary daily placement.

## 021 - Virtual Scroll Recenters Around The Visible Date

The infinite vertical scrollbar exposes a bounded two-month window around the current top visible date: one month before and one month after. When scrolling settles, the visible date becomes the new anchor and the scrollbar is moved back into the center of the rebuilt range. This prevents a tiny unusable scrollbar thumb across years of dates while still allowing continuous past/future navigation.

The virtual scroll spacer keeps the month-before/month-after range, but mounted day DOM nodes are capped to the visible range plus five day sections of overscan. This keeps fast nearby scrolls populated while preventing far-away dates inside the scroll range from adding unnecessary browser node pressure.

## 022 - Recenter Preserves Intra-Day Offset

Rebuilding the virtual window after ordinary scrolling must preserve both the top visible date and the pixel offset inside that date. Pending scroll targets therefore store `{ dateKey, offsetWithinDate }` and restore the exact offset after the month window is rebuilt. Explicit calendar membership changes use a different structural policy: preserve the top visible date, but align its date header to the viewport top after rows or columns settle. This gives show/hide controls a predictable date boundary instead of retaining an arbitrary row-local offset. During an active draft, the draft date is temporarily pinned into the rendered virtual items so explicit event/slot restoration can retain its stronger geometry target.

Native scrollbar-thumb dragging can complete without another React scroll callback after release, so the view also
listens for the browser `scrollend` event and schedules the same settled recenter used by scroll debouncing. Interior
positions retain the 1.2-second idle delay so ordinary pauses do not churn the bounded model. At the absolute top or
bottom, the delay is reduced by 80% to 240 ms because the user cannot continue until a new bounded range is centered.
Large wheel, thumb, or imperative jumps can arrive before the virtualizer has mounted the new edge items, so scroll
handling still schedules the delayed recenter when the immediate top-date snapshot is unavailable. Even if the date is
already the current anchor, the delayed recenter still scrolls back to the anchor's centered offset so the scrollbar
thumb resets without correcting immediately after release.

Vertical zoom changes are layout changes, not user scrolls. Slider zoom snapshots the current top visible date before requesting the parent-owned zoom change, cancels pending recenter timers, and restores a proportional intra-day offset after the virtual day height changes instead of writing the old raw `scrollTop` back into the resized list. That structural restore uses the new uniform base-day geometry directly rather than a virtualizer offset cached before the commit. `Shift` + wheel zoom instead anchors the nearest rendered date/time node and flushes the controlled zoom update before restoring scroll, so the restore uses committed layout measurements.

## 023 - Dense Time Labels Are Progressive

Time labels thin out based on available pixel spacing. The view removes 15 and 45 minute labels first, then removes every minute label at the densest scales while keeping hour labels visible. This preserves scanability without overlapping numbers.

## 024 - Rendering Stats Stay Demo-Only

The PoC sidebar reports average redraw frame interval, visible event DOM-node count, and total rendered calendar DOM-node count with a throttled browser-side sampler. These stats help evaluate virtualization behavior across dataset scales, but they remain outside the reusable calendar API so production consumers can choose their own instrumentation.

## 025 - Infinite Timeline Is Split By Responsibility

`InfiniteTimelineView` was too large to reason about safely. The first modularization pass splits pure helpers, event shell rendering, row/day rendering, virtual scroll anchoring, day metrics, and async visible-range loading into focused modules. Future work should continue extracting hit-testing, drag/drop, draft drawing, and hover lane selection until orchestration files are close to the 100-200 line target.

## 026 - Source Folders Mirror Product Responsibilities

The reusable library now groups files by responsibility instead of keeping all implementation files flat under `src/lib`. Public shell/types live in `core`, pure data/date/time/layout/interaction helpers live in their own folders, and infinite-view orchestration, hooks, components, and utilities live under `infinite`. This keeps imports readable and makes architecture documentation map directly to code.

Code modules include short JSDoc plus `@see` links to architecture or refactor docs where the behavior needs more context than a source comment should carry.

## 027 - Styles Follow Ownership Boundaries

Reusable @quno/calendar/timeline styles live with the infinite view and are imported by that module. Demo app chrome and the demo event card keep their own styles outside the library. This keeps the package closer to a reusable component library instead of a demo page with one global stylesheet.

## 028 - Unit Tests Live Outside Source

Vitest unit tests live under `tests/unit` with paths that mirror the source modules they cover. This keeps shipped source folders focused on library/demo code while preserving a direct mapping from tests back to implementation.

## 029 - Current-Time Marker Does Not Cover Labels

The current-time marker uses the same timeline coordinate as the grid and stays above grid data, day-header bands, and event cards. Body lines render inside row grids, and day-header marker segments render in the gray day band so the marker is continuous through the calendar zone. Sticky date/calendar labels stay above the marker, so horizontal scroll cannot place the red line, pin, or time labels over label text where the pointed time is no longer visible.

## 030 - Day Headers Paint After Rows

Each virtual day renders absolute calendar rows first and the sticky day header after them. This keeps the date label visually above row labels while preserving normal row hit-testing and the single sticky time-header layer.

## 031 - Calendar Cells Share One Border Token

The calendar shell, sticky labels, time header, row dividers, and timeline grid lines use the same 1px gray border token. Each shared edge is owned by one adjacent cell layer to avoid transparent seams or doubled 2px lines during horizontal scrolling.

## 032 - Drafts Do Not Recalculate Row Layout

New-event drafts are visual overlays in the target row. They do not enter committed row event lists, overlap lane assignment, row-height metrics, or virtual day resizing while the pointer is moving. Active edit drafts follow the same layout rule: the source event is filtered before horizontal row-height and vertical column-width metrics are computed, and the controlled draft renders as an overlay replacement. Once creation is accepted and inserted into loaded events, or an edit is saved into the parent event store, the committed event participates in normal layout recalculation.

## 033 - Infinite Views Are Named By Time Orientation

The horizontal view is `view="infinite-horizontal"` because time runs horizontally. The calendar-column view is `view="infinite-vertical"` because time runs vertically inside each date. The public surface uses only these explicit orientation names.

Vertical calendar columns default to a `240px` minimum, fit up to three parallel events, and then grow by `80px` for each additional overlap lane. These values are parent-owned settings so product surfaces can choose compact or wide column rules without changing library internals. The vertical date and doctor-name row uses native per-day sticky positioning rather than synchronized overlay state, and the left date/time pane is 30% narrower than the horizontal row-label pane. The vertical timeline adds an 8px gutter before the first hour and after the last hour so labels and events do not touch the board edge. The time pane is sticky only on the left axis so its labels move vertically at the same pace as events.

## 034 - Demo Variants Stay Outside Calendar Internals

Additional demo routes are implemented as self-contained parent components over `QunoCalendar`. Each variant folder owns its settings, selected defaults, interaction mode, app chrome, and external event renderer, while sharing only deterministic event data helpers and keeping reusable calendar internals unaware of product treatments.

## 035 - External Popups Own Create And Edit Forms

The reusable calendar reports create/edit intent but does not own product form UI. `onEventDraftRequest` delegates drawn creation to the parent, `onEventActivate` reports clicked events for editing, and `activeDraft` renders one parent-owned create/edit preview. Edit previews filter out the loaded source event and render the draft in its proposed position, preserving popup-owned save/cancel semantics without mutating loaded data. The drawn-create local draft is cleared one animation frame after delegation so the parent-controlled draft can take over in the same visible position. While an active draft is present, new grid drawing is blocked and only that draft remains draggable; `onActiveDraftMoveRequest` lets the parent update popup state from drag proposals. Multi-calendar active drafts move as a block so participant edits remain the source of calendar membership changes. Selected-calendar changes refetch visible ranges without clearing the previous event cache first, so draw-to-popup filtering does not create a blank frame. If participant filtering removes every selected calendar while a draft is active, the calendar retains the last non-empty draft rows or columns as hidden inert placeholders so the virtual layout does not collapse. The default demo asks its range loader for the full selected calendar set while an external draft filters visible rows, because cancel expands those rows again and should not display empty calendars while the filtered range refetches. The demo popup sits above the calendar current-time marker because editing controls should remain visually and interactively primary while the form is open. The parent owns participant-filtering policy, save latency, validation errors, whether edit opens keep current calendars visible, how empty participant lists disable save, whether visible row-only changes and visible cancel restores avoid date/time centering, whether create cancel restores the drawn calendar row inside the date after visible calendars expand again, whether create cancel after participant additions still targets the originally drawn participant row, whether a repeated draw on that same date/calendar row keeps the new popup draft at the same viewport-relative row position, whether edit cancel returns to the original first person's event instance, whether date edits move naturally when the destination is already visible, and whether a form change avoids scrolling a visible draft or restores an offscreen draft to its last seen viewport-relative position. Parent restore logic should cancel delayed corrections once the user manually scrolls or once a newer draft geometry edit makes the pending correction stale, but should ignore virtualizer relayout scrolls that do not follow a user scroll gesture. Exact anchor corrections can still use an offscreen event element, which keeps dense draw-to-popup handoffs focused when participant filtering shrinks the day heights before the replacement draft is visible. If a layout expansion temporarily unmounts the target, the restore falls back to date/time navigation immediately and then keeps delayed exact-correction retries for measurement settling; this prevents wrong-date flashes before the idle recenter runs. Starting a new restore cleans up the previous manual-scroll cancellation listener so a stale cancel restore cannot invalidate a newer draw handoff. The library owns the viewport-anchor and active-draft release mechanics through `QunoCalendarHandle` so parent forms can capture an event or slot before changing state, fade out a released draft shell, restore a replacement target after render, and cancel stale corrections after manual scroll without querying internal DOM. This keeps product forms agnostic of horizontal versus vertical geometry while still preserving create/edit/save/cancel positioning.

## 036 - Large Files Split By Ownership Boundary

Timeline gesture state is shared by horizontal and vertical views through `useTimelineInteractions`; each view keeps only orientation-specific geometry, hit-testing, and rendering orchestration. The default demo keeps product popup behavior outside the calendar library through `useExternalEventDrafts` and `ExternalEventPopup`. Playwright specs are split by behavior so coverage can grow without returning to one oversized scenario file.

## 037 - Package Surface Is Explicit

The public package entrypoint exports `QunoCalendar`, public API types, `defaultQunoCalendarSettings`, and event membership/move helpers. Concrete infinite view components and draft internals stay internal so consumers depend on the stable shell instead of orientation implementation files.

## 038 - Release Build Separates Library And Demo

The library builds to `dist` with ESM, UMD, generated TypeScript declarations, and a package stylesheet subpath at `@quno/calendar/timeline/styles.css`. The demo builds separately to `dist-demo`, keeping package verification focused on the artifact consumers install.

## 039 - Low-Risk Surface Props Stay View-Agnostic

`className`, `style`, `ariaLabel`, and `initialDateKey` are accepted by the shared calendar prop contract and forwarded by both orientations. `initialDateKey` only changes the initial virtual anchor; if omitted, the previous `now`-based anchor remains the default.

## 040 - View Orchestration Uses Focused Hooks

Shared setup, hit-testing, wheel zoom anchoring, drag lifecycle, and draft lifecycle live in focused modules rather than inside orientation render coordinators. Decision 050 supersedes the former technical `hooks` bucket with responsibility-domain ownership.

## 041 - The Example Is A Public Integration Field Guide

The single `/guide` route connects product needs to recipe-sized live exhibits. Its source
imports the public package and stays separate from the larger stress variants under `demo/showcase`. The `src/` tree is
reserved for reusable library code, and an architecture check rejects demo regressions into it.

## 042 - Async Data Never Owns Calendar Geometry

Dates, resources, scrolling, zoom, drafts, and hit-testing render independently from `loadEvents`. The range loader uses a policy-derived warm window, diffs it against loaded and in-flight dates, splits missing regions around cached gaps, retains a 120-date LRU cache, preserves stale buckets during refresh, supplies an optional abort signal, rejects stale generations, retries failures after 250ms and 1s, and commits prepared responses through a React transition. This makes API latency additive—events can arrive later—rather than blocking the calendar surface. Targeted move/create/commit patches use an event-id index instead of rescanning every cached date.

## 043 - Event Cells Are Indexed And Prepared Once

Events for one date are indexed by calendar membership in one pass. Timed events in each date/resource cell receive deterministic heap-based overlap lanes in `O(n log n)`. The resulting prepared cell is reused for row height or column width and for orientation-specific rectangles, avoiding separate sorting and lane assignment in metrics and rendering. Availability, drafts, and drop previews remain separate layers and do not change committed overlap metrics.

The repository demo sends its locally selected fixture range through `POST /api/demo-events`. Vite middleware serves
the endpoint locally and a matching root `api/` Web handler serves it on Vercel. The endpoint delays and returns the
JSON response so DevTools and browser tests exercise an actual abortable HTTP request. This transport stays outside
`src/lib`; consumers provide their own HTTP client behind the unchanged `LoadEvents` contract.

## 044 - Virtualization Covers Both Axes

Bounded date virtualization remains the primary axis. Each mounted date now also binary-searches variable-size resource prefix extents and mounts only the visible cross-axis resources plus two-resource overscan on both sides. Full extents remain in layout, so unmounted rows and columns do not compact scroll geometry. Draft and preview resources can be pinned outside the ordinary window.

## 045 - Anchoring Uses An Instance Geometry Registry

Days, resources, and event instances register their DOM elements with the owning calendar instance. Viewport
capture/restore and event-visibility checks resolve this registry instead of querying global selectors. Event focus
treats the viewport area covered by sticky time/date/resource chrome as occluded: it scrolls only when the requested
shell is clipped or offscreen, and leaves both axes untouched when the shell is already fully visible. Event
unregistration is element-identity-aware, preventing a stale unmount from removing a newer event instance with the same
event/calendar key. Restore work shares one cancellable animation-frame slot, mutation observer, resize observer,
registry subscription, and deadline. Pointer, wheel, touch, and keyboard intent can cancel delayed corrections. The
interaction runtime likewise uses one Pointer Events pathway so mouse compatibility events cannot duplicate drag or
draft transitions.

## 046 - Package JavaScript Does Not Inject Styles

The library emits an explicit `@quno/calendar/timeline/styles.css` asset. ESM and CommonJS JavaScript imports do not touch `document`, which keeps package loading safe in Node and SSR environments. Library date operations use tested local-date and `Intl` helpers instead of a runtime `date-fns` dependency; the demo may keep development-only fixture utilities without increasing the consumer bundle. The declared `@tanstack/react-virtual` dependency remains an external package import instead of being copied into the library artifact, preventing duplicate virtualizer code in consumer applications.

## 047 - Demo Variants Are Presets Over Shared Modules

Showcase routes are declared in a registry, and related demo variants supply small preset objects to shared shells and
controllers. Dataset controls, view controls, system time, rendering metrics, external-draft navigation, save
simulation, and sidebar sections have focused ownership. The integration field guide remains independent from the
larger demo application.

## 048 - Zoom Reprojects Geometry Without Rebuilding Content

Zoom necessarily changes event coordinates and browser paint, but it does not change event membership, overlap lanes, horizontal row metrics, or vertical column metrics. Those prepared models therefore depend only on event data and their actual metric settings, not on zoom. `EventShell` keeps geometry in the outer positioned element and memoizes product-renderer content separately, so an unchanged event card is not reconstructed when only its shell moves or resizes. Horizontal slider and other external zoom changes preserve a visible current-time marker before paint. If the marker is outside the viewport, they preserve the time at the visible grid center once the user has scrolled horizontally, while the timeline origin preserves its left edge. The anchor keeps a pre-commit scroll snapshot because the browser may clamp the live `scrollLeft` as a zoom-out commit narrows the timeline. Vertical zoom keeps a temporary render-window override centered on the semantic top date and projects it with the new uniform day height while virtualizer measurements settle; this prevents a frame selected from the new scroll offset and stale item sizes from showing blank or wrong dates. Time labels use an always-mounted five-minute skeleton and percentage-based track; coarse modes hide minor labels instead of creating or removing nodes when fine cadence activates. The modest fixed node cost avoids a large mutation and paint burst at the zoom threshold. `Shift` + wheel retains its more specific pointer anchor, accumulates raw mouse/touchpad steps into one controlled commit per display frame, and suppresses the generic correction for that gesture. A direct external zoom change wins over and cancels an older queued wheel frame.

## 049 - Late Data Preserves A Semantic Grid Slot

Async events may increase horizontal overlap depth after a date is already visible. Generic virtual-item compensation understands date rectangles but not which resource row the user was viewing, so late metric commits use a distinct data-layout anchor. Exact date navigation preserves the date header. Mid-date scrolling captures `{ dateKey, calendarId, offsetWithinRow, fallbackOffsetWithinDate }`, resizes affected dates, then translates the same resource-local point through the new row prefix extents before paint. A missing resource falls back to the clamped date-local offset. Horizontal time scroll is independent and remains unchanged. Newly mounted events never become focus merely because they arrived. Vertical overlap affects column width rather than date height, so date/time focus remains settings-owned. Explicit parent restores, active interactions, and pending navigation retain priority over this automatic correction.

## 050 - Runtime Source Follows Responsibility Domains

The infinite runtime is organized into `scroll`, `events`, `anchors`, `interactions`, `rendering`, and `views`. These are stable ownership boundaries; transient phases such as scroll pause or prefetch remain modules inside the owning domain. API prefetch belongs to events even though visible dates originate in scroll, and semantic visual focus belongs to anchors rather than a DOM “focused element”.

Domain documents provide the ownership contract and source map, while flow documents remain authoritative for execution order. Folder placement and focused names communicate ownership in source without repeating a banner in every file. The architecture check enforces module and function size; TypeScript, unit tests, and browser tests verify the actual integration boundaries.

## 051 - Event Prefetch Is Policy-Driven And Gap-Aware

Event acquisition keeps adjacent dates warm before navigation reaches them. `eventPrefetchPolicy` receives rendered date keys and selected calendars; the default keeps a predictable seven calendar days warm on each side, while consumers can choose a different fixed or adaptive window. The coordinator remains authoritative for freshness: loaded and in-flight dates are removed before requests start, and non-contiguous missing regions are loaded independently so a cached middle range is not refetched merely to acquire dates on both sides. Policy changes expand or contract the desired warm window without invalidating fresh buckets.

## 052 - Demo Zoom Has A Narrow Render And Paint Boundary

The showcase remains a controlled calendar consumer, but its zoom state lives in a provider below the route controller. Calendar projection and sidebar display use separate contexts. Slider requests update the native thumb/readout immediately and coalesce calendar projection to the latest value once per animation frame; wheel/touch requests update the calendar immediately and debounce the range thumb and numeric readout until the 300ms gesture tail settles. This bounds calendar reprojection and native-control writes while keeping the final value accurate. The route shell, popup, metrics panel, and unrelated settings controls do not render again. The reusable calendar shell uses stacking isolation and its overflow clip, but no longer applies broad paint containment to the rapidly changing scroll surface because that boundary can expose incomplete raster tiles during large zoom changes. The zoom input/output and live metrics retain narrow local layout, paint, and compositor boundaries. The full sidebar deliberately has no paint containment because a changing child could otherwise invalidate and rasterize the whole menu despite stable React and DOM identity. It is instead promoted as isolated, stable application chrome on a parent compositor layer; the changing child layers rerasterize independently and calendar paint frames cannot visibly clear the menu.

## 053 - Executable Tests Replace Source-Text Policy Checks

Architecture automation keeps objective size limits and the library/demo boundary. Behavioral structure such as stable zoom DOM identity, narrow render subscriptions, and compositor containment is verified through unit and Playwright assertions instead of scripts that search implementation text. Domain ownership is documented once in the folder structure and domain guides rather than repeated in generated file banners. This removes maintenance-only code while preserving the same runtime and release behavior.

## 054 - Event Focus Is A One-Shot Root Coordination

Event focus is exposed both as a keyed `focusRequest` and as `QunoCalendarHandle.focusEvent`; both use one
`QunoCalendar` coordinator above the orientation views. The caller supplies a complete event, avoiding an event-id
lookup contract. The coordinator requests every known participant calendar, waits for the controlled selection, then
uses the existing instance geometry registry to restore the preferred local instance. Focus is semantic viewport focus
plus a temporary `focused` renderer status, not DOM focus or a permanent scroll constraint. Manual intent and newer
requests cancel older work. An event on an excluded weekday is unavailable rather than normalized onto another date,
which avoids reporting a false focus or moving the viewport to a date where the event cannot render.

## 055 - Visible Cache Deletion Is Targeted And Parent-Owned

`removeVisibleEvent(eventId)` removes the indexed record from its loaded date bucket, which removes every horizontal or
vertical projection of a multi-calendar event without reloading a range. It does not call an API or create tombstones;
the parent must persist deletion before patching the visible cache and ensure later loader responses omit the event.

## 056 - Interaction Callbacks Opt In To Gesture Families

The calendar must not enter drawing or dragging state unless the parent provides a callback capable of completing that
gesture. Create callbacks enable empty-grid drawing, move or activate callbacks enable persisted event presses, and the
active-draft move callback enables controlled-draft dragging. This keeps read-only recipes genuinely inert and prevents
orphan drafts or drag states in examples that intentionally demonstrate only loading, layout, or creation.

## 057 - Viewport Activity Telemetry Is Demo-Owned And Settled

Viewport scroll/reposition messages are showcase instrumentation rather than a reusable calendar callback. The default
demo observes its rendered viewport and reports only after a 180ms quiet period so wheel bursts do not consume the
bounded activity history. Recent wheel, touch, scroll-key, or native-scrollbar intent classifies movement as manual
scrolling; movement without that intent is classified as programmatic repositioning, including date navigation, idle
virtual-window recentering, and anchor corrections. This keeps the library API focused while making its scroll behavior
visible in the PoC.

## 058 - The Integration Guide Is One Editorial Surface

The integration route teaches concepts in one scrolling article instead of mounting one numbered step at a time. Each
chapter owns a focused public-API exhibit for virtualization, event rendering, zoom, overlap, delayed loading, or
appearance state; later exhibits mount near the article viewport and remain mounted after first reveal. Every calendar
uses one accessible full-screen shell around the same React instance, preserving its visible date, intra-date offset,
and loaded cache. The opening chapter frames horizontal time as the denser way to keep people, resources, rooms, and
appointments visible while reserving the mouse wheel and touchpad’s ordinary vertical gesture for rapid row/day
navigation. The article scopes smaller, single-line date typography to its examples, reports scroll settlement as
`scrolled` then `repositioned`, demonstrates hover handoff through expanded cards, and shows parent-owned single-doctor
creation plus renderer-owned add/cancel motion. The card specimen grid includes replayable save and cancellation
treatments. Its live motion calendar narrows and enlarges the active time window so renderer transitions remain
visually inspectable without changing their event geometry. A custom-card lab keeps the same event shells mounted while
the external renderer promotes product, patient, or room data for different workflows. Example toolbars put their
current status or active-state label before the related controls so state is
read before action. The drag/create recipe stages gesture proposals as controlled drafts and keeps committed data
unchanged until its explicit Accept action; Accept clears the controlled draft before an appearing cache commit, while
Cancel uses the active-draft release lifecycle so the rejected proposal can fade before removal. Additional labs
expose the existing availability-layer switch—with mode-specific creation,
visually emphasized active availability, and parent-accepted availability moves—current-time reference, imperative
date/time navigation, scoped CSS plus settings presets, English/Japanese localization plus human-relative and binary
day-name strategies, CSS-native sticky chrome, and event-relative viewport anchoring across draft replacement
and overlap-lane recomputation. The lane-comparison lab aligns horizontal and vertical projections to the same
collision time after an orientation switch. Date and time fields navigate as their values change, with previous, next,
and Today as equally direct product controls. The zoom chapter describes scale as a task-driven transition—out for
daily context and in for precise reading or placement—with anchoring presented as what makes that transition feel
continuous. The chapter sequence moves from the current-time reference through direct navigation and controlled zoom
into progressive label precision: the stable five-minute tick
structure reveals more labels only when zoom creates readable space. The sticky-chrome lab explicitly separates
browser-positioned static labels from React-owned events and interaction state. The stability lab also makes
multi-calendar identity explicit: one shared event is projected into doctor and room calendars while focus remains
local to the requested instance. A final lab composes navigation, zoom, styling, overlap, mutation, and motion through
the same public API. The closing payload chapter leads with verified production gzip JavaScript and CSS sizes, keeps
raw build sizes secondary, and separates the package total from one external runtime dependency and two React peer
dependencies. The preloading lab mirrors successful loader responses
in a visible warm-cache strip so prefetched data is inspectable before its date is mounted. This presentation behavior
stays in `demo/examples` and does not add reusable calendar props or state. Read-only, drag/create, availability,
vertical comparison, delayed loading, and preloading are article chapters rather than standalone routes. A table of
contents makes the long-form surface directly navigable, and the main demo links to it.

## 059 - Performance Is Expressed As A Design Envelope

The field guide states the intended operating range—roughly four to hundreds of events per day—and a smooth 60–120fps
scrolling target without presenting either as a universal runtime guarantee. Total history does not define frame cost:
date and resource virtualization bound mounted geometry, loaded dates live in a bounded cache, event membership and
overlap cells are indexed and prepared once, unchanged renderer content is memoized, scroll chrome uses native sticky
positioning, and pointer/zoom work is coalesced to animation frames. Actual frame rate still depends on the browser,
hardware, viewport, event collision shape, and consumer `eventRenderer`. Stable algorithmic scaling, DOM/cache ceilings,
and scripting/layout budgets remain executable tests; the article’s 4/40/400 cards communicate the range rather than
claiming benchmark results from a reader’s device.

## 060 - Date Localization Is Settings-Owned

Horizontal and vertical date chrome share one `Intl.DateTimeFormat`-based label formatter. The formatter uses
`settings.dateLocale` when supplied and otherwise follows the runtime locale, avoiding a bundled locale table while
letting products make server/client output deterministic. English month/day labels preserve ordinal days and the
locale’s day/month order; non-English locales use their native numeric-day conventions. A caller-provided
`dayNameGenerator(date, locale)` owns the complete displayed label, so human-relative terms, explicit dates, binary
sequences, or other product vocabulary do not inherit a redundant built-in month/day prefix. Generated vertical labels
use the primary line instead of the default two-line month/day plus weekday structure. The generator does not affect
date keys, excluded weekdays, event loading, navigation, or virtualization.

## 061 - Vercel Publishes The Demo Artifact

The repository produces an installable library in `dist` and a runnable Vite application in `dist-demo`; a deployment
must not infer that the first directory is the website. The checked-in Vercel configuration therefore runs the focused
demo build, publishes `dist-demo`, and falls back to `index.html` for client-side routes. The demo's local Vite-only
event-delay transport has a matching Vercel Function so the hosted application preserves the same async-loading
behavior without adding a runtime dependency to the reusable package.

## 062 - Date-Sequence Changes Restore Semantically

Raw `scrollTop` cannot survive an `excludedWeekdays` change because removing or restoring weekdays changes every later
virtual index. Structural restoration therefore retains the semantic top date, writes an initial base-geometry
position, and repeats alignment after the virtualizer adopts the replacement keys and horizontal variable day sizes.
Controlled-draft calendar filtering has stronger focus when its date is in the ordinary virtual viewport: the current
or just-released draft date carries across row collapse/expansion so transient measurement snapshots cannot override
the parent's exact event or slot anchor during create cancellation. An offscreen draft remains only a render pin and
does not displace the user's visible date.

## 063 - Cross-Domain Imports Use One Library Alias

Imports that cross from a nested @quno/calendar/timeline domain back to the `src/lib` root use the single `#quno-internal/timeline/*`
alias. Imports within the same feature folder remain relative. One root alias removes fragile multi-level parent
traversal without inventing a separate alias for every responsibility folder, and the architecture check prevents deep relative
imports from returning. Its explicitly private name distinguishes it from the exact `@quno/calendar/timeline` demo alias, which
exercises only the package's public entrypoint and does not expose internal subpaths. TypeScript resolves the mapping
relative to `tsconfig.json` without the deprecated `baseUrl` option, while the demo/test Vite config and library build
resolve the same mapping. `vite/vite-env.d.ts` supplies Vite's ambient asset declarations so strict editor diagnostics
also recognize side-effect CSS imports.

## 064 - Calendar Colors Are Inherited Consumer Variables

Color values describe product presentation rather than calendar geometry, so they use semantic inherited CSS custom
properties instead of React state. `styles/palette.css` owns every internal color literal once; library selectors
consume public `--quno-calendar-*` variables with those private palette values as fallbacks and deliberately do not assign the
public variables on `.quno-calendar-shell`. This lets a theme defined on a wrapper win without depending on stylesheet import
order. One shared palette covers both orientations; `--quno-calendar-vertical-header-bg` remains only as a compatibility alias.
An event's explicit `color` still wins over the calendar-level default event accent.

## 066 - Controlled Wheel Zoom Commits Outside Active React Work

Shift-wheel zoom remains parent-controlled, but its callback must not synchronously force React work while a render is
already active. The calendar therefore schedules the controlled request in a microtask and begins pointer-anchor
restoration on the following animation frame. Virtual scrolling likewise uses TanStack Virtual's queued rerender path
instead of its synchronous notification option. This preserves anchor ordering without coupling calendar consumers to a
specific React scheduling implementation.

## 067 - Geometry Registration Survives Strict Mode Effect Replay

The instance geometry registry is populated by mounted callback refs and naturally becomes unreachable when its
calendar instance unmounts. Effect cleanup cancels active restore work but does not empty the registry, because React
Strict Mode replays effects while retaining those mounted refs. Clearing it during replay leaves a freshly opened
calendar unable to capture the first drawn slot, so participant filtering can align that draft date to the viewport
instead of preserving the pointer-relative position.

## 068 - Delayed Demo Loading Is Opt-In

The default showcase uses its instant mock-API mode. A deliberate 250ms, 1s, or 3s delay remains available through the
API delay control and in delayed-loading coverage, but the ordinary interaction path does not start with an artificial
one-second request. This prevents a quick create/cancel action on a freshly opened demo from being followed by a bulk
event-card paint that looks like cancellation redrew the calendar, while the reusable loader remains fully asynchronous
and transport-agnostic.

## 069 - Pointer Gestures Own The Recenter Deadline

Date: 2026-08-24
Status: Accepted

A settled-scroll recenter can already be waiting when a user begins drawing or dragging. A timeout callback that
captures the earlier inactive render may otherwise rebuild the bounded date tree 1.2 seconds into a held gesture,
producing a full-calendar flicker. Interaction start cancels that pending deadline, active-gesture scroll signals do not
arm another, and any callback already racing reads the current interaction owner before recentering. Idle maintenance
resumes only after a later scroll signal once the gesture has released.

## 070 - Loaded Dates Retain Calendar Coverage

Date: 2026-08-24
Status: Accepted

Selected calendars affect both rendering and the event API query, but changing the visible subset does not necessarily
make an accepted date bucket stale. The range coordinator records the calendar ids covered by each accepted date and
reuses that bucket whenever it contains the current selection. Narrowing draft participants and returning to the
previous selection therefore performs no request or cache publication. Because participant filtering can also shorten
days and expose an extra virtual date, active drafts retain the last settled warm window and add the draft date's and
virtual-window anchor's policy windows. Expanding to an uncovered calendar, moving a draft, or navigating beyond that
window still loads the required data, while incompatible in-flight requests are aborted and cannot commit late.

## 071 - Released Draft Animation Is Paint-Isolated

Date: 2026-08-25
Status: Accepted

Cancelling a controlled draft intentionally restores the previous participant rows immediately while retaining the
draft shell for a short opacity fade. The draft shell owns a paint-containment and opacity-compositor boundary before
that animation begins. Its fade and delayed removal therefore remain local to the one preview card instead of
invalidating the restored calendar surface. The draft animation, participant-only projection, and cancel anchoring
contracts remain unchanged.

## 072 - Equal-Start Overlap Order Survives Mutation

Date: 2026-08-25
Status: Accepted

Appointments that share a start time use their stable caller order before comparing their end times. A duration edit
therefore cannot promote the modified appointment into another lane merely because it became shorter. Targeted cache
patches also replace same-date records in their existing ordered slot, including temporary-id replacement, instead of
deleting and appending them. Moving to another date still removes the source and appends to the loaded destination,
and appointments with different start times retain chronological ordering.

## 073 - Structural Transitions Retain Semantic Date And Resource Nodes

Date: 2026-08-25
Status: Accepted; supersedes the calendar-membership alignment policy in Decision 022

Ordinary calendar visibility changes affect the resource axis, not the date sequence. Horizontal changes therefore
translate the existing top-edge resource anchor through the next row geometry, while vertical changes leave date/time
scroll untouched. A surviving resource retains its row-local offset; a removed resource falls back to a clamped
date-local position. Membership changes no longer align the date header to the viewport top.

Excluded weekdays still replace the date-index sequence and require structural restoration. During that bounded
transition, render items use their semantic date keys and a base-geometry window around the saved top date. All resource
rows or columns in that transition window stay mounted until the virtualizer adopts the replacement indexes and scroll
offset. A workday that remains visible therefore retains its date, row, and event DOM identities without an intermediate
wrong-date or wrong-calendar frame. Active-draft event/slot restoration retains its stronger explicit anchor.

## 074 - Idle Recenter Is A Semantic Structural Transition

Date: 2026-08-25
Status: Accepted

Idle recenter replaces the bounded month window and writes an equivalent scrollbar position; it is not a content
navigation. The window anchor therefore participates in the structural render identity alongside excluded-weekday and
vertical-geometry changes. While the replacement indexes and centered scroll offset settle, the renderer pins a
base-geometry window around the saved top date and keeps that window's resources mounted. The visible date, intra-day
offset, resource rows or columns, and event DOM nodes survive the reset without an intermediate wrong-date tree or
painted redraw. Pointer interactions and explicit parent anchors retain higher priority than idle maintenance.

## 075 - Project Discovery Is Feature-First

Date: 2026-08-25
Status: Accepted; supersedes the single-route guide policy in Decisions 001 and 041

The demo root is a concise project overview rather than a mounted calendar. It presents exactly three cards: infinite
calendar, date range input, and date input field. Each card owns a dedicated field-guide route, and each field guide
links through a visible Demo button to a focused component route. This keeps first contact lightweight and lets readers
choose the relevant responsibility before mounting heavy examples. The timeline field guide retains lazy exhibit
mounting. Former `/guide`, `/story`, and integration-walkthrough bookmarks redirect to the infinite-calendar guide,
while the package, public entry points, and independence of the three components remain unchanged.

## 076 - Timeline Demo Navigation Reuses The Shared Date Input

Date: 2026-08-25
Status: Accepted

The infinite-calendar demo and its navigation field-guide exhibit use `QunoDateInput` in single-date mode as the one
date-navigation control. Committing a date calls the public calendar navigation handle immediately; the unrestricted
demo retains its product-owned default focus time without exposing a separate time field. The main demo does not add a
Go action or Add event button: appointments begin by drawing where they belong on the timeline. Theme selection remains
in the dedicated styling chapter rather than being duplicated in the final composed demo. The components remain
independent; the demo owns the date-input-to-calendar-handle connection.

## 077 - Four Primitives Share One Editorial Guide System

Date: 2026-08-25
Status: Accepted; supersedes the three-card count and naming in Decision 075

The package presents Quno/Infinite Calendar, Quno/Datepicker, Quno/Date Input, and Quno/Date Parser as four independent
primitives. Their public entry points are `infinite-calendar`, `datepicker`, `date-input`, and `date-parser`;
Infinite Calendar uses the `QunoInfiniteCalendar` facade family, and Date Input no longer re-exports parser utilities.
The root remains headless and old JavaScript subpaths are rejected.

All four field guides share the Infinite Calendar's warm editorial shell, navigation, terminology, Try it callouts,
and collapsible Implementation recipes. The home presents four equal cards and every guide links to All components and
its focused Demo. The former 25-part Infinite Calendar guide becomes 13 task chapters while keeping its old hashes as
subsection anchors and keeping heavy exhibits lazy. Documentation routes retain redirects; package entry points do not
retain compatibility exports.

## 078 - Repository Imports Use Stable Responsibility Aliases

Date: 2026-08-25
Status: Accepted; extends the private source-alias policy in Decision 063

Imports must not encode three or more levels of directory traversal. Public package surfaces use
`@quno/calendar/*`; private library modules use `#quno-internal/*`; demo, API, and root-project references use
`#quno-demo/*`, `#quno-api/*`, and `#quno-project/*`. TypeScript and Vite resolve the same mappings, including test
mocks. The architecture guard scans source, demo, tests, API, and Vite code so moving a test or implementation file no
longer silently breaks deep relative imports.

## 079 - Infinite Calendar Topics Remain Independent Chapters

Date: 2026-08-25
Status: Accepted; supersedes the 13-chapter consolidation in Decision 077

The shared editorial system remains, but Quno/Infinite Calendar presents each of its 25 distinct jobs as an independent
numbered chapter and table-of-contents entry. A chapter may contain one focused calendar exhibit, or no exhibit when it
owns introductory or production guidance; unrelated exhibits are not grouped beneath one number. Existing hash anchors
remain canonical and heavy calendars remain lazy. This keeps the guide's visible hierarchy aligned with the behavior
being explained while preserving the four-product navigation, terminology, and shared theme from Decision 077.

## 080 - Cross-Folder Imports Never Traverse Parent Directories

Date: 2026-08-25
Status: Accepted; supersedes the depth threshold in Decisions 063 and 078

Same-folder dependencies may use concise `./` paths. Every cross-folder module import uses a stable responsibility
alias: public `@quno/calendar/*`, private `#quno-internal/*`, demo `#quno-demo/*`, API `#quno-api/*`, browser-test
`#quno-e2e/*`, unit-test `#quno-tests/*`, or root-project `#quno-project/*`. TypeScript and Vite resolve the same map.
The architecture guard rejects any module specifier that begins by traversing to a parent directory across source,
demo, unit tests, browser tests, API, and Vite code. Moving a file therefore cannot silently reinterpret a cross-folder
dependency.

## 081 - Published Stylesheets Remain Readable

Date: 2026-08-25
Status: Accepted

The library build keeps each independently exported stylesheet formatted and unminified in `dist`. JavaScript remains
optimized, and the demo retains its own production-build policy. Readable CSS makes the component selectors, scoped
tokens, slots, and state hooks inspectable without requiring source maps or a separate source package. Package
verification rejects a minified stylesheet, while gzip budgets continue to measure the consumer transfer cost of each
feature independently.

## 082 - Scroll Corrections Publish Their Virtual Range Before Paint

Date: 2026-08-25
Status: Accepted

The date virtualizer uses its synchronous scroll-notification path so a programmatic viewport-anchor correction and
the matching rendered date range commit in the same browser frame. This is scoped to virtualizer scroll notifications;
controlled wheel-zoom projection still commits outside active React work as required by Decision 066.

Without the synchronous range publication, cancelling a participant-filtered draft could restore the scrollbar before
React mounted the dates at that offset. The cache and semantic anchors remained correct, but the viewport painted one
or two empty frames. Frame-by-frame browser coverage now requires visible days, resource rows, and committed events
through the complete cancel transition while retaining their settled DOM identities and making no API request.

## 083 - Reviewed Mutations Preserve the Working View

Date: 2026-08-25
Status: Accepted

The parent-reviewed mutation example captures a semantic viewport anchor before it stages a create or move proposal.
When a saved appointment moves to another date or resource already in view, the controlled draft is restored against
that anchor so its target row stays at the same viewport-relative position instead of jumping to the top. The parent
retains the original anchor throughout review; Accept transfers the position to the committed event, while Cancel
restores the saved source event or original creation slot with navigation fallback disabled.

This makes review UI feel local to the work that initiated it and demonstrates the public anchor contract without
moving persistence responsibility into the calendar. Manual scrolling can still cancel a pending restoration, so user
intent takes precedence over the pre-proposal snapshot.

## 084 - The Resizable Card Lab Uses Native CSS

Date: 2026-08-25
Status: Accepted

The event-card container-query lab uses one live shell with the browser-native lower-right resize corner instead of
separate React-controlled width and height sliders. CSS owns `resize: both`, clipped overflow, the initial dimensions,
and the minimum and maximum bounds. Container queries continue to decide which renderer details fit after the browser
changes the shell geometry.

This keeps the exhibit aligned with the contract it teaches: card adaptation and the demonstration's resize mechanism
are both CSS behavior, while React supplies the unchanged event renderer and data.

## 085 - Virtualizer Notifications Stay Queued Across React Runtimes

Date: 2026-08-26
Status: Accepted; supersedes the synchronous notification mechanism in Decision 082 and restores Decision 066

TanStack Virtual uses its queued notification path instead of its `flushSync` option. React 19 warns when the
synchronous path runs from a lifecycle. After a structural scroll correction, the existing layout-restoration effect
requests an ordinary React projection; layout-effect updates complete before paint, so geometry cannot outrun the
rendered range and no synchronous React DOM escape hatch is needed. Programmatic corrections keep the same semantic
anchor contracts.

The empty-frame concern from Decision 082 remains a required outcome, but it is enforced through frame-by-frame DOM,
geometry, identity, and computed-style browser coverage instead of a synchronous React escape hatch. A separate packed
React 19 development fixture rejects console warnings, errors, and exceptions while the React 18 and Preact fixtures
remain independent.

## 086 - Empty Create Draft Membership Preserves Context

Date: 2026-08-26
Status: Accepted

An externally controlled create draft may temporarily have an explicit empty `calendarIds` list while its editor stays
open. The calendar does not render that unassigned draft in its fallback `calendarId` row. The demo treats the empty
participant filter as the normal visible-calendar set, keeps Save disabled, and restores against the drawn slot rather
than an event target that cannot exist without a membership.

This keeps the drawn date and editor focus stable while calendars are toggled off and on. Selecting a participant
renders the same active draft again without closing and reopening its lifecycle or navigating away from the working
date.

## 087 - Date And Resource Cells Share One Presentation Callback

Date: 2026-08-27
Status: Accepted

Products need date-aware and resource-aware treatments such as weekend shading or a distinct equipment color, but a
horizontal-only row hook would not transfer to the vertical projection. `getCalendarCellProps(context)` therefore owns
presentation for the logical date/resource cell in both views. Its typed context reports date, weekday, Today/weekend
state, calendar metadata, and active view; it may return only `className`, `style`, and `title`.

Horizontal rows and vertical columns apply the result to their grid surface and visible resource label or header. The
calendar retains fixed geometry, event layering, interaction handlers, accessibility state, and virtualization. Stable
`calendar-cell` and `calendar-cell-label` slots let stylesheet consumers distinguish data from chrome without exposing
private orientation components.

The typed callback and its two orientation projections increase the measured ESM artifact to 32.40 KiB gzip, so the
Infinite Calendar JavaScript ceiling moves from 32 KiB to 33 KiB. The field guide reports the new 131.71 KiB raw and
32.40 KiB gzip artifact independently from the unchanged optional stylesheet budget.

## 088 - Cell Presentation Has Its Own Field-Guide Chapter

Date: 2026-08-27
Status: Accepted; refines Decision 087

Whole-calendar theming and per-cell presentation solve different product tasks. The Infinite Calendar field guide keeps
theme presets in their existing chapter and teaches `getCalendarCellProps` in a new, independently numbered chapter.
The focused exhibit switches between horizontal rows and vertical columns while applying weekend and equipment colors
from typed cell context.

This preserves the one-topic-per-chapter editorial contract and makes the new public callback discoverable without
implying that data-driven cell treatments are theme tokens. Existing chapter hashes remain stable; later chapter
numbers advance by one and the guide now contains 26 items.

## 089 - Date Presentation Composes With Resource Presentation

Date: 2026-08-27
Status: Accepted; refines Decisions 087 and 088

Weekend and holiday treatments often belong to a complete date, including its visible date header, rather than only
the resource content inside it. `getCalendarDayProps(context)` therefore receives date, weekday, Today/weekend, and
active-view context and may return the same presentation-only `className`, `style`, and `title` values as
`getCalendarCellProps`.

Day presentation projects onto the date section, visible date chrome, and each resource cell in both orientations.
Resource-cell presentation composes after it and wins conflicting styles or titles, allowing an equipment color to
override a weekend background without losing the date-wide class. Fixed geometry, accessibility, event layering, and
interaction handlers remain calendar-owned. Stable `calendar-day`, `calendar-day-header`, and `calendar-day-label`
slots expose the new boundary alongside the existing cell slots.

The composed date presentation raises the measured ESM artifact from Decision 087's 131.71 KiB raw and 32.40 KiB gzip
to 133.71 KiB raw and 32.80 KiB gzip. It remains within the accepted 33 KiB gzip ceiling and does not change the
optional stylesheet budget.

## 090 - Clock-Hour Presentation Projects Across Both Time Axes

Date: 2026-08-27
Status: Accepted; refines Decisions 087–089

Products need time-based treatments such as lunch, shift changes, or non-bookable clock hours independently from a
date or resource theme. `getCalendarHourProps(context)` therefore receives a zero-based hour, the visible interval's
clipped start and end minutes, and the active view. It returns the same presentation-only `className`, `style`, and
`title` surface as the date and resource callbacks.

The callback resolves each visible clock hour once per view. Its result projects onto every resource content band and
the corresponding visible time label in horizontal and vertical layouts. Bands paint above day/resource backgrounds
and below availability, events, drafts, current-time markers, and pointer interaction. The calendar retains fixed band
geometry and exposes stable `calendar-hour` and `calendar-hour-label` slots.

The hour projection raises the measured artifact to 136.83 KiB raw and 33.44 KiB gzip and the optional stylesheet to
10.21 KiB raw and 1.95 KiB gzip. The Infinite Calendar JavaScript ceiling moves from Decision 089's 33 KiB to 34 KiB;
the stylesheet remains inside its existing 2 KiB gzip ceiling.

## Shared contract update — 2026-09-05

[QUNO-012](../shared/decisions.md#quno-012---give-library-functions-named-contracts-and-align-product-ownership)
supersedes historical positional signatures and customization names for this product. The accepted interaction,
presentation, and geometry behavior in this ledger remains in force. See the
[migration guide](../shared/migration.md#unreleased-named-contracts-and-product-ownership) for exact replacements.

## 091 - Availability Has Independent Collision Lanes

Date: 2026-09-08
Status: Accepted; supersedes the full-row and no-metric-growth portion of Decision 017 and refines Decision 059

Availability remains background context expressed by `kind: "availability"`, but overlapping windows for one resource
now receive deterministic lanes of their own. Appointment and availability records are partitioned once and prepared
independently with the same stable `O(n log n)` allocator. Horizontal availability uses vertical mini-lanes, vertical
availability uses side-by-side lanes, and equal starts retain caller order. Resource geometry uses the larger of the
appointment and availability depths rather than their sum, so appointments continue to overlay availability without
competing for its lane numbers.

`renderEvent` receives the real `lane`, collision-group `laneCount`, and `isOverlapping` values for availability. The
existing interaction-layer rules, focus and appearance states, multi-calendar projections, and background z-order
remain unchanged. Draft and drag-preview geometry remains transient and joins normal preparation only after commit.

React-facing date buckets retain their array identity until that bucket changes. Date/resource preparation is cached
by bucket identity, selected resources, visible time bounds, and any draft source belonging to that date. Accepted
range responses and targeted mutations therefore invalidate only affected dates instead of rebuilding every prepared
cell in the bounded cache.

The layered cache, frame scheduler, and measured recenter bridge raise the ESM artifact to 159.29 KiB raw and 37.56
KiB gzip. The
Infinite Calendar JavaScript ceiling moves from 37 KiB to 38 KiB; the optional stylesheet remains 1.95 KiB gzip inside
its existing 2 KiB ceiling.

## 092 - Horizontal Row Navigation Belongs To The Calendar

Date: 2026-09-24
Status: Accepted

An external editor can know a date, time, and calendar id before its target row is mounted. The public
`scrollToDateTime({ date, time, calendarId })` handle accepts an optional `calendarId` for horizontal row navigation.
The existing geometry registry and cancellable viewport restoration pin and reveal an offscreen resource after date
virtualization settles; an already-visible row is not moved vertically. The calendar owns sticky-header offsets and
row visibility, while the editor calls only the public handle. The vertical view keeps its date/time behavior because
it has columns, not rows.

## 093 - Event Entity Kind Is Separate From Its Render Layer

Date: 2026-09-25
Status: Accepted; refines Decision 091 and supersedes Decisions 017 and 019's implicit background-layer rule

`CalendarEvent.kind` identifies the scheduling entity (`appointment`, `availability`, or `blocker`);
`renderLayer: "availability"` explicitly selects the background treatment. Decision 091's independent lanes and
maximum-depth sizing apply to this background layer only. Without the layer override, an availability is a foreground
editable event in `events` mode and shares its overlap lanes and metrics with appointments and blockers. Background
availability is pointer-transparent in `events` mode; `availability` interaction mode targets that layer. This permits
internal scheduling editors while retaining the background treatment for consumers that opt into it.

## 094 - Contextual Creation And Explicit Row Centering

Date: 2026-09-29
Status: Accepted; refines Decision 092

`getVisibleDateKeys()` reports sorted dates intersecting the usable viewport through the existing geometry registry,
excluding overscan and sticky chrome. Products can choose the middle visible date when opening a creation form without
scrolling or querying package DOM. `scrollToDateTime({ date, time, calendarId, align: "center" })` centers a horizontal
resource row even if it was already visible; omitted alignment retains Decision 092's existing visibility behavior.
The vertical view retains its existing date/time navigation. Recurrence calculation remains owned by the consuming app.

## 095 - Consumer-Owned Initial Loading Fallback

Date: 2026-09-29
Status: Accepted

`isLoading` and `loadingFallback` optionally cover initial context and event loading with consumer-owned markup.
An initially empty selection defers the timeline mount, avoiding header-only geometry before resource rows arrive.
With selected rows, the hidden timeline keeps its dimensions and runs its normal event loader; revealing it does not
remount it. The consumer clears loading on readiness or failure and may center its initial date through the existing
navigation handle. Omitted fallback preserves the existing rendering behavior; background refreshes can keep the grid visible.

## 096 - Returning A Drag To Its Starting Slot Does Not Activate

Date: 2026-09-29
Status: Accepted; refines Decision 028

The calendar distinguishes pointer clicks from drags before coalescing move frames. Movement more than four pixels
from the initial press is remembered until the gesture ends, including movement within one snapped slot or outside
the timeline. Returning a drag to its original minute and calendar clears the preview without invoking activation
or requesting a move. Ordinary clicks still invoke `onEventActivate`; consumers need no pointer-movement guard.
Changed drops retain the existing parent-owned persistence boundary.

## 097 - Navigation And Restoration Wait For Committed Layout

Date: 2026-10-05
Status: Accepted; refines Decisions 045, 092 and 094

A consumer can update selected resources or its controlled draft and call `scrollToDateTime` with a resource id or
`restoreViewportAnchor` in the same handler. The calendar consumes the request in its layout phase, after parent
props and registered geometry commit, rather than measuring the previous layout. The latest date/time request in a
batch wins; date-only navigation retains its synchronous path and cancels a pending row request. Capturing an anchor remains synchronous so it records the position before the parent change.

Restoration keeps the existing geometry registry, virtual-row pinning, session notifications, fallback and manual-intent
cancellation. Cancellation also discards a pending restore before it starts. No new public options or forced React
commit are needed; React 18+, React 19 and Preact continue to share the same contract. Consumer persistence and form
submission remain outside this layout boundary.

## 098 - Project Local Events After The Persisted Cache

Date: 2026-10-05
Status: Accepted

`loadEvents` owns persisted data and invalidates freshness when its identity changes. Optional synchronous
`projectEvents({ events, startDate, endDate, calendarIds })` owns display changes for the inclusive rendered date window,
including empty dates. Apply it after the persisted cache and before layout in both orientations. The callback must
not mutate cached event records. Returned events are indexed by the existing local start-date semantics; events
outside rendered dates are ignored. Unchanged date buckets retain their preparation identity.

Changing or removing a projection never invalidates requests or commits previews into the cache. Removal restores
saved events immediately. Saves and filters use the existing loader and version invalidation. Recurrence expansion
and edited-series selection remain product-owned; consumers need no second cache to keep local editing off the API.

## 099 - Accept The 0.6.2 Infinite Calendar Payload

Date: 2026-10-05
Status: Accepted; supersedes only the Infinite Calendar JavaScript ceiling in Decision 091

The committed-layout navigation and local event projection in Decisions 097 and 098 produce a 168,119-byte raw
Infinite Calendar ESM artifact and a 39,858-byte gzip artifact. Raise its gzip ceiling from 38 KiB to 39 KiB
(39,936 bytes) to accept this 0.6.2 build. The size guard still rejects artifacts above the new ceiling.

Keep the optional stylesheet ceiling at 2 KiB and retain every other product budget. The field guide reports the
measured 38.92 KiB JavaScript and 1.99 KiB optional stylesheet payloads alongside their budgets.

## 094 - Allow 50 KiB For Infinite Calendar JavaScript

Date: 2026-10-06
Status: Accepted; supersedes Decision 091's 38 KiB JavaScript ceiling

The reported ESM artifact is 38.92 KiB gzip, exceeding the accepted 38 KiB ceiling. Raise the Infinite Calendar
JavaScript ceiling to 50 KiB to accommodate the current artifact and leave comfortable room for future changes.
Keep the guard, field-guide production facts, and verification documentation aligned. The optional stylesheet
retains its independent 2 KiB ceiling; all other feature budgets remain unchanged.

## 100 - Reconcile The Infinite Calendar Budget After Branch Integration

Date: 2026-10-06
Status: Accepted; supersedes Decision 099's 39 KiB JavaScript ceiling

Merge the calendar improvements with the accepted 50 KiB JavaScript ceiling from the independently assigned
[094 - Allow 50 KiB For Infinite Calendar JavaScript](#094---allow-50-kib-for-infinite-calendar-javascript).
Keep the optional stylesheet ceiling at 2 KiB and preserve the improved navigation, loading, and projection contracts.

The two Decision 094 records were assigned independently on separate branches. Preserve both identifiers, their
complete titles, and their distinct anchors; [094 - Contextual Creation And Explicit Row Centering](#094---contextual-creation-and-explicit-row-centering)
continues to define contextual creation and row navigation. The field guide and verification fixtures report fresh
measurements of the combined implementation beside the 50 KiB ceiling.

## 101 - Preserve Loading, Cache And Navigation Contracts Through Follow-up Actions

Date: 2026-10-06
Status: Accepted; refines Decisions 094 (Contextual Creation), 095, 097 and 098

An accepted drag applies proposed time and participant geometry to the cached persisted event, rather than copying
its projected display record into the cache. Projection-only ids are not added through moves; consumers explicitly
commit or load saved records. Removing a projection therefore restores saved titles, colors, and other metadata.

The loading shell owns supplied dimensions, including percentage and minimum sizes, before resource metadata exists.
Its mounted timeline fills the same space so dimensions are not applied twice. Other component presentation styles
remain on the timeline.

A later raw date request, explicit anchor restoration, or cancellation discards queued horizontal resource navigation.
Explicit centered navigation re-resolves the desired position from the current row height during the existing bounded
restore session, including async collision growth. Manual intent still cancels it; no new public option is introduced.

## 102 - Retain Participant Identity In Event Anchors

Date: 2026-10-06
Status: Accepted; refines Decisions 045 and 097

When capturing an event without a resource id, resolve one mounted instance and record that instance's calendar id
in the anchor target. Restoring that anchor follows the same participant instead of selecting a different visible copy
after each scroll correction. Explicit replacement targets remain consumer-owned.

The external editor preserves a surviving visible participant while toggling membership. Prefer the current anchor's
participant; transfer to another surviving visible participant only when needed. Capture before the update, then restore
after committed layout without a forced commit. An empty create selection retains its last slot anchor for the next
participant selection. Keep the original first-person edit anchor separately so Cancel can restore it after removal.
Browser checkbox focus and manual-scroll cancellation remain independent of visual anchoring.

## 103 - Preserve Measured Draft Layout And Defer Idle Recenter

Date: 2026-10-06
Status: Accepted; refines Decisions 045, 097 and 102

Horizontal draft presence and participant membership are data-layout changes, rather than settings-owned structural
changes. Keep measured day heights through opening, editing and closing a draft; resource metrics and the existing
parent restore handle the changed rows. Reset structural measurements only when header height, row height or excluded
weekdays change. This replaces the draft-dependent structural signature that could move a dense schedule by thousands
of pixels when entering edit mode.

The external editor captures the clicked event instance before hiding the source, then restores that instance after
the controlled draft commits. Preserve the original first-person Cancel anchor independently. A visible event capture
with `requireVisible: true` returns `null` if that event is missing or offscreen; a resource slot is not an equivalent
visible event anchor.

An explicit horizontal restore cancels pending idle recenter work. The recenter scheduler reads live restore ownership
both when scheduling and at an already armed deadline, preventing competing scroll corrections during row changes.
After restoration ends, the next scroll signal can schedule ordinary maintenance. Restore deadlines and manual-scroll
cancellation stay bounded as before. Dense three-participant create/save/edit tests include repeated rapid toggles and
eight seconds of geometry and DOM-mutation observation after the final change.

## Parser navigation example update — 2026-10-07

[QDPR-007](../date-parser/decisions.md#qdpr-007---return-paired-date-and-clock-endpoints) changes the independent
headless parser result. The guide's typed-date example now reads `start.date`; Infinite Calendar's navigation,
day-key model, and event timestamp contracts remain unchanged.

## 104 - Rebuild Base Estimates When Horizontal Row Counts Change

Date: 2026-10-08
Status: Accepted; refines Decisions 049, 073 and 103

A changed row count changes every base day height. TanStack retains cached prefix positions when only `estimateSize`
changes. Capture the date/resource anchor first, clear estimates, then reapply known dense-day sizes. Carry the anchor
through one layout projection so expansion can restore after the larger scroll spacer commits. Keep ordinary metric
updates and drafts with unchanged base height on the existing measured path. Explicit restores and gestures keep priority.

Clamp a missing-resource fallback inside the new base date height when event metrics are absent. Leave room for the
one-pixel visible-date probe. Defer base-estimate resets and render-window changes while an editor restore, draft or pointer gesture owns focus.
Refresh them after that owner releases. No public API changes are required. Chromium regressions cover 135-row contraction,
expansion, distant scrolling, empty selection, local row offsets, bounded reads and idle settling.

## 105 - Keep Late Offscreen Loads From Moving The Displayed Calendar

Date: 2026-10-08
Status: Accepted; refines Decisions 049, 073 and 104

Apply the committed-spacer anchor path to changed event heights as well as changed row counts. A large delayed
overlap update on an earlier date can exceed the old scroll area and clamp an immediate correction into that date.
Retain the displayed date/resource anchor through the spacer commit. Publish the corrected virtual range and render
it before paint so the anchored row never disappears for an intermediate frame. New events are never focus targets.
Refresh resource viewport metrics at the correction; ordinary native scrolling retains its frame-coalesced reader.

Skip the additional layout projections when heights have not changed. Keep explicit navigation, parent restores and
gestures authoritative. Capture current focus at the metric update rather than at request start. Chromium regressions
check every painted frame during offscreen growth, later-date growth, changed participant rows, shrinkage and navigation
while a response is pending. No public contracts change.

## 106 - Preserve Editor Outcome Dates Through Deferred Layout

Date: 2026-10-08
Status: Accepted; extends Decisions 097, 104 and 105

Support a parent anchor target containing only `dateKey`. Resolve the registered day on the vertical date axis and
leave horizontal scrolling unchanged. Keep the existing bounded restore session, explicit-navigation priority and
manual-intent cancellation. A missing date can retry navigation when committed geometry changes.

Refresh base measurements once after a date restore's draft releases. Compact prefix sizes can remain cached even
when the original row count returns. Keep event/resource restore and drag policies unchanged. Consumer editors choose
the opening date for Cancel and the Save-click date for a successful mutation. Appointments, availability and blockers
share that consumer policy. No new handle method or required prop is added.

## 104 - Anchor Horizontal Demo Editor Transitions To Resource Slots

Date: 2026-10-08
Status: Accepted; supersedes only the demo opening/Cancel event-point policy in Decisions 102 and 103

A compact overlap card can sit below its resource row's origin, while its edit draft and hovered presentation fill
that row. Capturing the compact card and restoring the full-row draft therefore scrolls the grid by the lane inset.
A closing event restore can then follow hover expansion and repeatedly correct the viewport despite unchanged data.

The focused demo verifies the clicked event instance before capturing its participant's resource/time slot for
horizontal editor opening and Cancel. Restore that slot after committed layout, retaining the captured participant
unless an explicit target replaces it. Keep the original first-person slot anchor for Cancel when that participant
is removed. Slot resolution stays independent of card hover and released-draft geometry. Vertical editors retain
instance anchoring; save and participant-edit policies, required-visible event captures, measured day retention,
bounded restore deadlines, and manual-scroll cancellation remain unchanged. This is consumer policy implemented
through the existing public handle, without a new package option or internal DOM query.

Browser regressions use the October 8, 2026 Acne Therapy overlap in one calendar at 1280px and 1800px. They require
unchanged row coordinates and top visible date through repeated opening, cancellation, and immediate hover while the
release/restore is active. Eight seconds of frame sampling and late DOM-mutation observation reject continuing
movement or redraws. Dense participant coverage now asserts the resource origin on editor opening and retains its
existing surviving-instance assertions through membership changes.

## 105 - Retain Horizontal Restore Dates Through Resource Changes

Date: 2026-10-08
Status: Accepted; refines Decisions 045, 102, 103 and 104

A parent restore must keep its target date mounted as well as its target resource. Closing an edit after participant
changes can resize every measured day and move the captured date outside ordinary overscan before restoration resolves.
The draft's date pin ends when the draft is cleared; restoring only the resource cannot recover a date that has unmounted.

The horizontal foundation supplies the active restore date to the existing layout-date pin and loader keys, using
measured or estimated offsets without expanding overscan or resetting day measurements. The restore target takes
priority over the controlled draft date, keeping one pin through draft closure rather than composing another render
window. Deduplicate dates already present. When the bounded session ends or manual intent cancels it, the pin returns
to the active draft date, or releases if the draft is gone. Creation retains its existing eager-range ownership
through the closing transition; the restore date can own the pin after that transition settles. Restoration keeps working with `allowNavigationFallback: false` inside the current bounded
window. Dates outside that window retain the existing navigation-fallback policy. No public option is added.

Demo edit Cancel clears the draft and queues its original participant restoration in the same handler without a forced
intermediate commit. Create Cancel retains its established commit and eager-range handling. Regressions repeat Acne Therapy → Marco → Room 202 → Surgery A → Marco → Dmitry → Cancel three
times at 1280 × 800 and 1440 × 900 with one and six calendars, plus the larger desktop case. They assert the October 8
row returns to its original position, immediate hover stays stationary, and no movement occurs after the restore ends.
The rebuilt Infinite Calendar artifact measures 39.57 KiB gzip JavaScript and 1.99 KiB optional CSS; the guide and
verification fixtures report those measurements against the unchanged 50 KiB and 2 KiB ceilings.

## Concurrent decision records reconciled — 2026-10-08

The merged branches independently assigned 104 to [horizontal base estimates](#104---rebuild-base-estimates-when-horizontal-row-counts-change)
and [demo resource-slot restoration](#104---anchor-horizontal-demo-editor-transitions-to-resource-slots), and 105 to
[late offscreen data](#105---keep-late-offscreen-loads-from-moving-the-displayed-calendar) and
[restore-date retention](#105---retain-horizontal-restore-dates-through-resource-changes).
Both accepted identifiers and texts are preserved. References distinguish these records by their full title/anchor.
New decisions continue after 106. These behaviors coexist: explicit editor restores own their target date, while
ordinary late data retains the date/resource visible when the response changes geometry. Consumer editors choose
their outcome policy through the existing handle; onboarding keeps its opening-date Cancel and Save-click-date policies.

## 107 - Separate Viewport Reads From Rendered Rows

Date: 2026-10-09
Status: Accepted; refines Decisions 070, 098 and 101

Loading uses committed viewport intersections after a 100 ms settling interval, independently of five-date render
overscan and pinned restore dates. Keep the last useful window while structural geometry is unavailable. Apply
the caller's prefetch policy only to this viewport window. Fast scroll reversals coalesce before requesting dates.

Optional `loadCalendarIds` describes provider read coverage separately from displayed `selectedCalendarIds`.
It defaults to selected IDs for existing calendar-scoped loaders. Consumers whose endpoint returns all owners can
keep that scope stable while filtering rows, including an empty selection. Do not invalidate data for owner display
filters. Retain adjacent pending boundary reads without fetching extra dates; abort distant or obsolete-generation
reads and keep the existing stale-response guards. Keep the last load window during drafts and their closing transition.
Reapply an existing parent restore before paint after the draft closes. Opening draft participant layout keeps its
existing restore sequence. A row-count resize uses the semantic date saved before its estimates change.

## 108 - Alternate Horizontal Surfaces By Logical Resource Position

Date: 2026-10-16
Status: Accepted; refines Decisions 044 and 064

Horizontal grid shading derives from the resource index in the complete displayed calendar list, matching the vertical
view. Pass that parity through the row renderer and apply `is-alternate` to its grid. Mounted sibling position cannot
own parity because pruning an odd number of preceding rows reverses every remaining shade. The field guide's night
theme uses the same state. Keep existing surface tokens, slots, cell overrides and resource geometry intact.

Chromium coverage starts with October 30 and 31 visible, scrolls in both directions through odd and even resource
pruning, and asserts computed colors for both dates against their complete-list colors.

## 109 - Restore Offscreen Saves To The Retained Editor Anchor

Date: 2026-10-16
Status: Accepted; refines Decisions 009, 035, 103 and 104 (demo resource-slot restoration)

The focused demo captures only a visible editor instance on Save and falls back to the retained last-seen anchor
when the user has scrolled away. A pinned offscreen draft's current coordinate must not replace that retained position.
Horizontal saves restore the saved participant's resource/time slot, independent of collision lanes and hover;
vertical saves retain event targets. The captured participant remains authoritative when rows expand after closing.

Visible saves keep immediate-only correction. Offscreen saves use the existing bounded after-recenter session so
date navigation and deferred row measurements can settle. Both paths yield to manual scrolling. This supersedes only
Decision 009's immediate-only rule for offscreen saves; cache patching, appearance and consumer-owned date-only
outcome policies remain unchanged. No public API changes are required.

Chromium regressions draw on October 20 for Marco Eggens, wheel to December, Save, and assert the original row offset
and saved event in both sparse and dense datasets, including settling beyond the restore deadline.

## 110 - Coordinate Editor Restoration And Virtual Projection Before Paint

Date: 2026-10-16
Status: Accepted; refines Decisions 097, 103, 105 (restore-date retention) and 107

Drawing and cancelling a create draft must batch parent state and its anchor request rather than committing the
filtered rows before requesting restoration. Keep the active restore date pinned through create closure as well as
edit closure. This supersedes only Decision 105's creation exception; eager navigation and the retained load window
continue to support creation transitions.

Horizontal date measurement can invalidate positions after the navigation layout effect runs. Finish the layout with
one current-session restore, publish the actual scroll offset and virtual date range, and refresh resource viewport
metrics. If the rendered range is stale, request another React layout projection before paint. Horizontal ongoing
session flushes belong to this final step; vertical restoration keeps its existing timing. Keep ordinary scroll reads
frame-coalesced, existing measured sizes, bounded restore deadlines, manual cancellation, and release fade-out.
No new public methods or props are needed.

Chromium regressions reproduce a one-frame 500px jump at October 17 in Room 203. At 1280px and 1800px they sample every
frame through opening and four seconds of cancellation, rejecting missing rows, movement, horizontal drift and blank
date gaps. Existing repeat-draw, participant-edit, save, loading and manual-scroll tests retain their contracts.

## 111 - Query Demo Event Ranges On The Server

Date: 2026-10-17
Status: Accepted; supersedes only the browser-filtered echo transport in Decision 043 and primary-only availability in Decision 020

Showcase requests send `{ startDate, endDate, calendarIds, eventsPerYear }` rather than complete event arrays.
The server validates inclusive dates, known resources, supported 100/1,000/5,000/20,000 dataset sizes, a 366-day maximum
span and a 16 KiB request ceiling. It generates deterministic fixtures for requested years, including leap days,
filters date/resource coverage and returns `{ events }`. Reuse one Web handler for Vite development/preview and Vercel.
Keep the existing optional delay, abortable browser requests, stable read coverage and calendar-owned cache contracts.
The demo build emits a server-only query bundle behind a native private package import. Development resolves it to
source; deployed Node functions resolve the emitted bundle, independently of Vite/TypeScript aliases. Both the
site build and the function's `vercel-build` hook prepare it; publish atomically to support concurrent builders.
Retain at most four annual fixture datasets on the server; do not generate whole-year event arrays in the browser.

Appointment times fit all participants' shared availability. Varied weekday shifts remain intentional. Use local
wall-clock fixture timestamps so server and browser timezones cannot shift those hours. Include the fixture year in
appointment IDs to keep cross-year reads distinct. This changes demo data, not the library timestamp contract.

Keep browser session overrides for explicit creates, edits and accepted moves. Merge the latest overrides when a
response resolves; replace edited records at their original response positions, suppress moved sources even outside
the queried range/selection, and append matching creations. Reset on dataset change or page reload. No shared mutation
backend or durable persistence is implied. No public package API, class or token changes are needed.

Unit tests cover query validation and bounds, overlapping reads, leap/cross-year generation, all-participant working
hours and pending-read/session-override races. Chromium asserts real request fields, working-hour geometry in Berlin
and New York, and saved edits/creates surviving refetches, alongside the existing full interaction regressions.

## 112 - Restore Horizontal Wheel Anchors In The Zoom Layout Commit

Date: 2026-10-17
Status: Accepted; supersedes only horizontal restoration timing in Decision 066; refines Decision 048

Horizontal Shift-wheel keeps its first pointer-nearest rendered time node and coalesces raw steps into one controlled
request per animation frame. Keep the parent notification in a microtask so React 19 never needs a forced commit.
Wait for the requested controlled value, then restore the captured anchor in that layout commit using the actual
effective settings, including the viewport-fill floor. Do not write predicted future geometry to the old DOM or retry
horizontal corrections in later animation frames. A delayed parent may keep the old view until it commits.

An external controlled value cancels wheel ownership immediately, including during the 300ms momentum tail. Its
normal visible-now/center/origin anchor applies in the same commit. Keep that path's scroll snapshot current after
wheel-owned corrections, and drop scheduled notifications on unmount. Ordinary trailing momentum suppression and
vertical date/time restoration retain their existing contracts. No public props, classes or tokens change.

Chromium samples every frame of dense 20,000-event wheel and slider zoom reversals at 1280px and 1800px, checking
current-time position, appointment projection and DOM identity. Unit tests cover a delayed parent, actual committed
geometry, external takeover and unmount before the scheduled notification.

## 113 - Commit Vertical Zoom Geometry And Focus Before Paint

Date: 2026-10-17
Status: Accepted; supersedes vertical restoration timing in Decision 066 and extends Decision 112 to both orientations

Both Shift-wheel orientations use one controlled commit coordinator. Coalesce raw wheel steps per frame and notify
the parent in a microtask. After the requested value commits, restore the first pointer-nearest node with actual
committed geometry in a layout effect. Vertical zoom no longer retries scroll correction over nine frames.
Carry that anchor through synchronous structural date-model commits before paint, then release commit ownership in
a microtask without scheduling another scroll write. Delayed parents keep their old view; newer external values
cancel wheel ownership, and unmount drops scheduled notifications. Retain the bounded momentum tail and cross-axis
scrolling captured for the latest wheel tick.

Vertical dates have uniform settings-owned heights. During zoom and date-model transitions, project retained semantic
date keys and pinned dates directly into their final index, start and size rather than translating stale measurements
with old inter-date spacing. The canvas height is the bounded date count multiplied by the committed day height,
so abrupt zoom-in cannot clamp against an old spacer. Publish the actual scroll offset, virtual range, visible date snapshot and resource
viewport metrics before paint, and synchronously reproject a stale date window. Keep the saved semantic date while
a structural scroll target awaits its new model; do not publish the temporary scroll position as a replacement anchor. Slider/external zoom retains its
existing top-date/time focus policy; wheel zoom keeps its pointer-specific focus. No public API or style changes.

Chromium samples dense 20,000-event wheel and slider reversals at 1280px and 1800px, including zoom from 8 through
the 0.5 minimum, abrupt 0.5-to-8 slider reversals, and across date-model recentering. Every frame checks time focus, appointment projection, node
identity and contiguous dates, including after the idle deadline. Unit tests cover delayed vertical commits,
synchronous re-anchoring, release before later navigation, external takeover and retained/pinned uniform geometry.

## 114 - Fade Progressive Time Detail In Both Orientations

Date: 2026-10-17
Status: Accepted; refines Decisions 006, 023 and 048

Use a 160 ms CSS opacity transition when progressive time labels and five-minute grid details appear or disappear
in either orientation. Keep the existing five-minute tick skeleton, label thresholds, accessibility state and zoom
anchors. Replace display-based hiding with transparent retained labels. Quarter-hour grid backgrounds remain steady;
one retained, pointer-transparent detail layer per resource paints only the two intervening five-minute lines.
Its gradient and gutter track committed geometry immediately, without animating coordinates or duplicating coarse lines.

Rapid zoom reversals continue from current opacity. Newly virtualized resources start at their current detail state;
scrolling does not trigger an entrance animation. Disable the transitions under `prefers-reduced-motion: reduce`.
No new public props or tokens are required. Existing cell and hour presentation and event interaction retain their layers.

Chromium checks both orientations across quarter-hour-label and five-minute-detail thresholds, pauses actual CSS
transitions to assert intermediate opacity, reverses unfinished fades, and checks final state, accessibility, retained
nodes, grid spacing and pointer transparency. Repeat with reduced motion and retain the frame-stability zoom regressions.

## 115 - Derive Time Detail Opacity From Zoom Without An Animation Tail

Date: 2026-10-17
Status: Accepted; supersedes Decision 114's timed transitions and refines progressive visibility in Decisions 006/023

The 160 ms fade introduced visible catch-up during Shift-wheel/trackpad zoom. Derive detail opacity synchronously
from the committed scale instead of starting a CSS animation. A reversal immediately restores the opacity for that
scale and stopping a gesture leaves no transition running. Keep the existing wheel scheduling and anchor coordination.

Use a 0.15-wide zoom ramp for each precision tier. Quarter-hour labels reach full opacity at zoom 2, five-minute
labels and grid details begin above 6, and half-hour labels begin at their existing minimum spacing. Hours stay fully
visible. Keep all semantic tick/detail nodes mounted, but use display-based hiding at zero opacity so hidden labels
and offscreen transparent grid surfaces do not add layout or animation work. Reduced motion makes visible detail fully
opaque. Preserve the steady quarter-hour background, gutters, custom hour presentation, accessibility and pointer behavior.

Chromium checks dense Shift-wheel and slider changes in both orientations, including partial opacity, repeated immediate
reversals, no CSS animations, display-hidden detail, geometry and node identity, and no later opacity change after input
stops. Existing per-frame wheel/slider anchor regressions remain required. Unit coverage checks current-scale opacity
and tier boundaries independently of gesture history.

## 116 - Remove Zoom Detail Transparency

Date: 2026-10-17
Status: Accepted; supersedes Decisions 114 and 115 and restores Decisions 006, 023 and 048's detail visibility

Remove the zoom transparency feature entirely at the user's request. Restore boolean label visibility at the original
readability thresholds, full opacity for visible labels, and display-based hiding with stable tick nodes. Render the
grid directly as one repeating background at 15-minute cadence, switching to five minutes only above zoom 6.
Remove the detail overlay component, opacity calculations, private opacity variable and transparency-specific styles.

Keep wheel/slider scheduling, committed zoom geometry and anchor restoration unchanged. Timepicker minute options
retain weight 400 under QTP-002. Browser coverage checks immediate visibility, grid cadence, stable nodes and no opacity
animations in both orientations with wheel/slider input and ordinary/reduced motion. Preserve prior records as history.

Integration note (2026-10-17): main published Decision 116 while the runtime branch used that number locally.
The runtime record retains its branch identifier as `116-runtime` to distinguish it from published Decision 116;
Decision 117 retains its identifier and refines that runtime record. The original branch record remains in commit `d8b6364`.

## 116-runtime - One Mathematical Runtime For Both Orientations

Date: 2026-10-17
Status: Accepted; supersedes the runtime mechanisms in Decisions 103, 110, 112 and 113 while preserving their user-visible contracts

Replace the independent viewport hooks and TanStack integration with one headless calendar engine. Pure prefix
extents and logical date/resource/time coordinates define both orientations. Rendering, hit testing, visibility,
virtualization and anchors consume one committed revision. One browser adapter owns programmatic scroll writes;
native sticky layout remains browser-owned. Keep tested lane algorithms, event shells and consumer callback lifecycles.

Explicit restore outranks gesture, navigation, data correction and idle recentering. Identity uses event and participant
IDs rather than collision lanes. Resolve queued imperative operations after controlled props commit. Wheel requests
remain frame-coalesced and controlled, and anchors use the actual accepted scale before paint. External changes and
manual cancellation invalidate eligible work. Flush pending native scroll before claiming wheel ownership. Retain the
external zoom anchor across successive values so browser scroll rounding cannot accumulate; manual movement, resize
and navigation reset that anchor. Recenter only after settlement, preserving semantic screen position.

Own immutable event buckets, request generations, retry cancellation and preparation in the new runtime. Keep the
120-date bound, viewport-only load coverage with explicit prefetch, independent collision layers and ephemeral
projection. Reuse unaffected date preparation and geometry. Virtualize dates and resources with bounded overscan.

Remove the private migration selector, old viewport/load/anchor implementations and the unused TanStack dependency
at cutover. Public names, props, handles, styling contracts and consumer-owned editing remain unchanged. Keep React
18, React 19 and Preact support without forced commits. Time-detail visibility follows Decision 116, which supersedes Decision 115.

Acceptance requires full public-contract browser coverage, seeded mixed actions, ten repeated frame-sensitive runs,
focused Firefox/WebKit checks and measured dense-calendar budgets. The rewrite record tracks evidence and commands.

## 117 - Separate Stable Layout From Viewport Presentation

Date: 2026-10-17
Status: Accepted; refines Decision 116-runtime without changing its anchoring or public contracts

Keep live viewport/ownership state in the engine, but expose a stable React snapshot while committed geometry,
visible dates, mounted date indexes and pinned/visible resource indexes are unchanged. Imperative handles and
pointer projection continue to read the current engine. Programmatic navigation and new geometry still produce a
renderable revision; stale browser commits remain rejected. Native scrolling within an unchanged window does not
require a React render.

Separate prepared resource metrics and prefix extents from zoom-dependent rectangles. Reuse the prepared map when
its date metrics are identical, index resource membership once, share empty resource metrics, and retain horizontal
row/date extents during zoom. Vertical column extents survive zoom when their width is unchanged. Project resource
rectangles only for requested targets. Date sequence caches and geometry caches are weakly keyed and do not retain
previous geometry chains. Changes to hours, row sizing, resource membership or data invalidate the affected structure.

Memoize the horizontal time scale and retain date-label formatting while its date/locale/formatter is unchanged.
Capture native scroll coordinates in the event callback and coalesce publication to a frame. Wheel zoom flushes
actual native position before claiming ownership; when that same request is accepted, consume any pending native
observation without rereading DOM dirtied by the parent render. External takeovers retain the unconditional flush.
Preserve all pre-paint anchor corrections, overscan and draft/focus pins.

Verify skipped React renders against live engine movement, navigation/pin publication, stable extents and correct
projected coordinates, hour-range invalidation and DOM-read ordering. Retain full browser geometry coverage and
repeat the production timing comparison against both the initial rewrite and main.

## 118 - Capture Shift Input Even When Zoom Cannot Change

Date: 2026-10-17
Status: Accepted; refines Decisions 112, 113 and 117's input capture without changing controlled zoom or anchor contracts

With `onZoomChange` present, reserve Shift-wheel input before checking wheel delta, zoom limits or anchor availability.
At zoom 0.5 and 8, continued mouse-wheel or trackpad movement must not fall through into native scrolling on either
axis. Do not request another controlled value when already at the limit. Extend the existing 300 ms momentum tail
for captured limit input, then allow ordinary scrolling after the tail expires.

Shift-modified `touchmove` also suppresses native panning without inventing a touch-to-zoom scale. It must not cancel
viewport ownership as manual scrolling. Ordinary touch remains native. Keep listeners non-passive and remove them
on unmount. Without `onZoomChange`, preserve native input behavior.

Verify both orientations with real browser wheel input at both limits, including horizontal and diagonal trackpad
deltas, unchanged native scroll coordinates, bounded momentum suppression and resumed ordinary scrolling. Unit
coverage checks no redundant callback, touch cancellation and listener cleanup.

## 119 - Suspend Native Momentum Scrolling During Zoom

Chrome on macOS can show rectangular white gaps through appointment cards, availability and grid backgrounds during
inertial Shift-touchpad zoom while sticky labels remain painted. DOM identity and geometry checks alone did not
reproduce the raster symptom. Preventing wheel defaults was insufficient; the affected session confirmed that
suspending native scrolling during zoom removes the gaps.

Extend Decision 118's Shift-input capture with a short-lived viewport overflow lock. Set `overflow: hidden` on the
first captured Shift-wheel/touch input and keep it until 300 ms after the latest captured sample. Hidden overflow
still permits the adapter's programmatic anchor scroll writes, but suspends native/compositor scrolling. Restore the
original inline shorthand/axis declarations and priorities when the gesture settles, on observed external takeover,
and on unmount. Ordinary scrolling resumes with the existing momentum-tail policy. Retain original zoom sensitivity,
frame coalescing, event membership, prepared lanes and render bounds; add no persistent compositor layers.

Unit coverage checks repeated hold/settle, style restoration, cancellation and unmount. Real-wheel Chromium/WebKit
checks assert the temporary computed overflow, unchanged native position at zoom limits and resumed ordinary scrolling.
Existing frame-by-frame tests assert pointer/time alignment and visible date geometry in both orientations. The user
confirmed the physical-touchpad raster gaps disappeared with this lock; earlier compositor and input-sensitivity
experiments were removed.

## 120 - Increase Shift-Wheel Zoom Sensitivity

Date: 2026-10-17
Status: Accepted; supersedes only the original sensitivity retained in Decision 119

Increase the fixed zoom step from 0.15 to 0.30 per nonzero Shift-wheel sample in both orientations. The same input
sequence covers twice the zoom range, addressing the reported slow response after native momentum was suspended.
Preserve the 0.5–8 limits, pointer anchoring, frame coalescing and controlled-parent accumulation. Retain Decision
119's native-scroll lock and its 300 ms settling tail to prevent white patches. Slider and external zoom remain
unchanged. Verify accumulated wheel requests, detail thresholds and per-frame geometry at the increased step.

## 121 - Pace Wheel Requests After DOM and Scroll Commit

Date: 2026-10-18
Status: Accepted; refines Decisions 112, 113 and 120; retains Decision 119

Keep at most one unexpired controlled Shift-wheel request outstanding. Accumulate every signed 0.30 sample into one
clamped target, including reversals, while waiting for the parent. The adapter acknowledges only a current rendered
revision after its programmatic scroll correction and clamp observation. A matching value in the logical engine
alone is insufficient. Emit the next accumulated target on the next animation callback after acknowledgment, with
no extra double-frame delay. Callbacks remain outside active React render/commit work.

External zoom, navigation, restoration, native movement, resize, disabling zoom and unmount discard queued intent.
A request unacknowledged for one second expires without retry; fresh input starts from the actual controlled value.
Late accepted values remain parent-owned and do not revive abandoned accumulated work. No public request IDs or
props are added; callback frequency can decrease for a delayed parent. Native observations and ordinary scrolling
remain independent of this zoom-only coordinator. Cancellation/expiry clears stale wheel anchoring in the engine.

This is DOM/scroll commit acknowledgment, not proof of paint, raster completion or GPU presentation. A temporary
private query switch disabled the native-scroll lock for a physical Chrome touchpad test. The user reported that
rectangular gaps returned with commit-aware pacing alone. Retain the lock and its existing 300 ms tail, and remove
the experimental switch before publishing. Automated DOM geometry checks do not replace this physical-input result.
Classify uncaptured wheel takeover in the next task, with one replaceable timer cleared on detach. Native browsers
can checkpoint microtasks between listeners; classifying then can cancel the gesture and release the lock before
the zoom handler reserves the momentum tail.

Verify delayed, immediate and rejected parents, reversals, saturation, stale acknowledgments, external cancellation,
timeout and teardown. Browser coverage samples anchor alignment, contiguous dates, event presence and overflow
restoration. Compare matched production builds to PR #44 head `d6ac965`, including callbacks, observed DOM commits,
input-to-commit latency and scripting/layout cost; record gate failures without claiming full acceptance.

## 122 - Use an Intermediate Shift-Wheel Zoom Step

Date: 2026-10-18
Status: Accepted; supersedes the 0.30 sensitivity in Decisions 120 and 121

Use a fixed 0.20 step per nonzero Shift-wheel sample in both orientations. This is one third less change per sample
than 0.30 and one third more than the earlier 0.15, providing the requested middle sensitivity. Preserve Decision
121's accumulated target and commit pacing, pointer anchoring, bounds, timeout and Decision 119's native-scroll lock.
Slider and external controlled values keep their existing behavior. Update accumulation and delayed-parent browser
expectations, and exercise zoom detail thresholds and frame geometry at the new step.

## 123 - Capture Momentum Until Wheel Input Is Quiet

Date: 2026-10-18
Status: Accepted; refines the momentum-tail policy in Decisions 118, 119 and 121

Choose native scroll or zoom mode from the first wheel sample after 300 ms of quiet, and retain that choice until
input is quiet again. Pressing Shift during a scrolling gesture must not turn its momentum into zoom. Native scroll
publications and manual-wheel classification must preserve that scroll-mode latch.

After captured Shift-wheel input, retain the gesture through subsequent unshifted wheel samples. Each captured
sample renews the 300 ms quiet period and native-scroll suspension, without requesting additional zoom. Releasing
Shift or lifting fingers must not convert an ongoing momentum stream into ordinary scrolling. Restore ordinary
scrolling after 300 ms without a captured sample. Browsers expose no portable wheel momentum-end signal, so this
is a quiet-period heuristic; a new wheel gesture inside that interval is also captured. Explicit viewport takeover
and unmount retain their existing cancellation behavior.

Keep request lifetime separate from input lifetime: a rejected controlled zoom request still discards queued intent
after one second, but its timeout does not release continuing momentum. Test decaying unshifted input beyond one
second in both axes, at zoom limits and with a rejected parent, then verify ordinary scrolling resumes after quiet.
Also test Shift pressed during ongoing native scrolling in both orientations, followed by a fresh zoom gesture.

## 124 - Follow the Current Shift State Immediately

Date: 2026-10-18
Status: Accepted; supersedes Decision 123's momentum capture and mode latch, and Decision 118's unshifted tail capture

Use each wheel event's current Shift modifier to choose zoom or ordinary scrolling. Do not infer finger contact,
inertia, direction changes or gesture restarts, and do not impose a quiet-period delay on mode changes. The user
explicitly accepts remaining momentum changing modes when Shift is pressed or released. Discard the unshipped
restart-detection experiment.

Keep Decision 119's native-scroll suspension while handling Shift input, including zoom limits. Release overflow
immediately on Shift keyup; already collected zoom intent may finish its normal commit-paced processing. The first
unshifted wheel event cancels pending zoom intent and scrolls immediately. If keyup was missed and overflow was
still hidden during hit testing, prevent that event's default action and deliver its delta once through the viewport
adapter (pixels directly, lines at 16 pixels, pages at the viewport extent). Subsequent scrolling remains native.
Release/cancel on window blur and remove global listeners on cleanup.

Retain the 0.20 step, one outstanding controlled request and one-second request lifetime. The existing 300 ms idle
unlock and anchor-continuity interval remain housekeeping only; neither prevents switching modes on input. Test
immediate modifier transitions, zoom limits, missing keyup, one-time delta delivery and cleanup in both orientations.

## 125 - Reveal Overlap Lanes During Demo Pointer Movement

Date: 2026-10-18
Status: Accepted; refines QUNO-023's Calendar demonstration without changing library hover contracts

The concept overlap preview routes unpressed pointer movement through the browser's actual topmost element on each
animation frame. Existing row/column hit testing resolves the original overlap lane beneath an expanded card.
Do not directly select a covered event, wait until cursor arrival to trigger hover, or dispatch a click/press to
reveal it. Keep scenario destinations in JSON. Moving a real pointer over the calendar cancels playback before the
same event reaches the component, so manual hover immediately controls the revealed appointment.

Browser coverage checks continuous movement, browser hit targets, underlying-lane handoff, no press/click/editor,
and real-pointer takeover in both orientations. This change is confined to the demo actor; public component
interaction and rendering behavior remain unchanged.

## 126 - Keep Concept Card Text Legible Across Zoom Levels

Date: 2026-10-18
Status: Accepted; refines the concept's consumer-owned event presentation

Keep every concept card text row on one line with ellipsis and no flex shrinking. Put the appointment title first.
Below 38 px of available event height, use a compact title row and hide the secondary clock row; hovering restores
the clock and appointment details through the calendar's existing expanded geometry. Never wrap clocks or squeeze
text rows into partial-height fragments as zoom or overlap density changes.

Give hovered concept shells a 240 px minimum target width, bounded by the existing hover allowance, while preserving
events already wider than that target. Vertical hover remains bounded by its resource column. Keep duration geometry,
underlying-lane hit testing, and public package styles unchanged; these rules belong only to the concept renderer.

Browser tests check line height, no wrapping, ellipsis, containment, hover width, revealed details, and restored
dimensions at 0.5, 1.3, 3, and 8 zoom in both orientations, plus the packed 400-event fixture at minimum zoom.

## Separate demo configuration — 2026-10-18

[QUNO-026](../shared/decisions.md#quno-026---give-each-product-demo-its-own-json-file) moves this product’s concept
scenarios into its own JSON file. Component contracts and scenario behavior remain unchanged.

[QUNO-027](../shared/decisions.md#quno-027---store-every-scenario-in-its-own-json-file) further separates every scenario
into its own file; the product JSON retains only metadata and ordered references.

[QUNO-028](../shared/decisions.md#quno-028---navigate-demo-screens-with-a-bottom-title-rail) records viewport-sized
scenario sections, JSON explanations, explicit fullscreen, and inert mobile previews shared by the concept demos.

## 127 - Keep the Concept Calendar Fixed Across Scenarios

Date: 2026-10-19
Status: Accepted; refines the Calendar presentation in QUNO-028 and supersedes its per-scene calendar mounting

Keep the calendar canvas outside the scrolling explanation sections, retaining one public component instance and
shared cached appointment source. Scenario changes and Replay/Reset restore JSON presentation settings and starting
date/time without deleting session edits. Density projects 4/40/400-event subsets of that source; all other authored
scenes show the same six appointments per day, including the overlap. Remove the old per-scene `overlap` flag.

Give labels 70% more space (`labelWidth: 238`, vertical time pane 167 px). Remove the top controls and bottom date/count
stats. Only `initial.controls` declared by the current scenario appear in a bottom-right dock; no controls are shown
for scroll, overlap, create, or move. Fullscreen retains state, and mobile inline previews remain inert. Package
contracts are unchanged. Verify fixed bounds during scroll, retained DOM/data identities, saved edits, control
geometry, label widths, playback outcomes, and mobile/fullscreen behavior.

[QUNO-029](../shared/decisions.md#quno-029---preserve-scenario-text-layout-during-scrolling) keeps complete concept explanation layouts mounted and reserves playback/status space, preventing text jumps during scrolling and activation.

## 128 - Demonstrate Concurrent Loading And Verify Visible Stability

Date: 2026-10-19
Status: Accepted; refines Decision 043's preloading exhibit and Decision 116-runtime's verification

Share demo-only pending-request tracking between the HTTP showcase loader and the fixed-fixture preloading guide.
Increment for each invocation and decrement in `finally`; only zero pending reads means idle. A newer response must
not hide an older pending read. Preserve request arguments, abort signals, results, errors and stable loader identities.
Keep the guide's deterministic fixtures and delay. Add Back to starting date so readers can verify cached navigation
after the destination's missing ranges settle. No public package or runtime scheduling changes.

Measure participant-edit and save stability using the same semantic date and viewport-relative day/card positions.
Bounded-window recentering may translate internal `scrollTop` without moving those positions. Keep focus, lane state,
horizontal-scroll and late-mutation checks. Verify overlapping completion order and failures/aborts in unit tests;
browser coverage checks immediate cached cards, return-request counts and control containment.

## 129 - Configure Prefetch Distance In Screens

Date: 2026-10-19
Status: Accepted; supersedes Decision 051's seven-day default and refines Decision 107's viewport loading boundary

Default to one screen before and one after the usable viewport. `eventPrefetchPolicy` may return
`{ beforeScreens, afterScreens }` with nonnegative fractional distances; a screen is viewport height minus the sticky
day-header height, measured along the date axis in either orientation. Resolve coverage against actual logical date
extents, including dense rows, vertical zoom and excluded weekdays. Do not approximate screens by visible-date counts.
Clamp coverage to the bounded date sequence; existing idle recentering extends that sequence. Normalize negative or
nonfinite values to zero. Preserve explicit `{ beforeDays, afterDays }` policies and their calendar-day semantics.

Subscribe acquisition planning to the live engine independently of React's rendered-window publication. A buffer edge
can change while the same date remains visible. Only changed requested-date keys publish React state and restart the
100 ms settling gate. Resizes, layout changes and policy updates recalculate coverage; accepted and pending dates
remain deduplicated. Drafts retain earlier coverage and their draft/anchor dates; screen padding comes from the actual
viewport rather than offscreen pins. Keep the 120-date cache bound and stale-response guards.

Expose Prefetch distance as a guide control backed by consumer-owned state and a stable policy callback. Offer
0, 0.5, 1, 2 and 3 screens per side; zero disables new adjacent reads and narrowing preserves fresh cached data.
Use July 9 for the deterministic cached-navigation example. Unit tests cover exact pixel boundaries, fractional
distances, density, vertical zoom, excluded weekdays and live-engine subscription/cleanup. Browser tests compare
requested coverage against measured date heights, change distance live, and check desktop/phone control containment.

## 130 - Keep An Adjacent Day Warm For Every Enabled Screen Buffer

Date: 2026-10-19
Status: Accepted; refines Decision 129's screen coverage with a minimum adjacent-day guarantee

For each positive screen distance, union the pixel-based buffer with the immediately adjacent included date outside
the visible date window on that side. Dense calendars can show only a tenth of one day; they must still warm the next
day when forward prefetch is enabled, and the previous day when backward prefetch is enabled. Larger pixel windows
may cover more dates. Use the included date sequence so weekends or other excluded weekdays are skipped; stop at the
bounded model's available edges and let the existing idle recenter extend the model.

Apply the floor independently to each side, including positive fractional distances. Zero, negative and nonfinite
values retain the zero-distance opt-out; explicit calendar-day policies remain unchanged. Preserve loaded/pending
deduplication and the existing cache bound. The guide explains the floor alongside its existing distance control.
Unit coverage checks a tenth-day viewport, asymmetric/zero/invalid distances, excluded weekends and bounded edges.
Chromium checks 135-calendar geometry with less than a tenth-day visible, both adjacent dates in the first read,
and cached coverage while scrolling within that same date.

## 131 - Guide Fullscreen Calendar Scenes With A Floating Card

Date: 2026-10-19
Status: Accepted; supersedes Calendar's fullscreen-only-demo chrome in QUNO-028 and retains Decision 127's stable canvas

Open the Calendar fullscreen demo with a floating card above the full-width live calendar. Reuse the scene's JSON
title, explanation paragraphs, recipe anchor, and manifest order. Previous/next arrows select the adjacent scene
paused and show its description; disable the corresponding arrow at each end. See demo dismisses the card and
replays the selected scene. Replay and Play tour also dismiss it. Keep scene arrows and Show description available
in the top navigation while the card is hidden. Reopening the description pauses playback without resetting the
current view. The card has no backdrop, so the exposed calendar remains interactive.

Place Back in the top navigation; Back and Escape stop playback, exit fullscreen, restore the selected inline
section, and focus its launch button. Preserve the mounted calendar, dataset, and session edits. Continue immediate
manual takeover for pointer/hover, wheel, keyboard and focus, with no automatic resumption. Keep the top navigation's
height stable when dismissing the card, allow the card to scroll on short displays, and retain mobile fullscreen
interaction. Other products keep their existing fullscreen presentation. No package API or runtime changes.

Browser coverage asserts card containment and hit-test layering, full-width calendar bounds and retained DOM identity,
unchanged viewport bounds when dismissing the card, scene order/boundaries, playback and manual interruptions,
recipe links, top Back, Escape, and launch focus/section restoration across desktop, phone, and landscape sizes.

## 132 - Open The Calendar With A Movable Guide And Inline Contents

Date: 2026-10-19
Status: Accepted; supersedes Calendar presentation in Decision 131 and QUNO-028/QUNO-029, retaining Decision 127's mounted calendar and shared edits

Make the full-width Calendar and floating information panel the default `/concept` Calendar view on desktop and
mobile. Keep the product header until the calendar's top-right fullscreen icon hides it; the same corner icon or
Escape exits fullscreen and restores launch focus. Keep previous/next navigation in a persistent bottom bar.
The floating panel owns Back and the complete table of contents, using the product manifest's titles and order.
Choosing a title returns to its explanation; Escape leaves contents before exiting fullscreen. Other products retain
scenario pages, title rails, and inert mobile previews.

Start the selected Calendar scene automatically on entry and scene navigation, except for reduced-motion visitors,
who start paused. Manual input stops playback without automatic resumption. Keep playback actions inside the panel,
with no separate top playback row, See demo action, interaction instruction, or Explore at your own pace status.
Replay and subsequent scene changes collapse the explanation to keep the working calendar visible; restoring it pauses the scene.

Drag the entire panel, including its title, paragraphs and empty space, with mouse or touch. Buttons and links keep
their normal actions and never begin a drag. Remove the dotted handle. Keep an explicit collapse/expand icon, retain
position through collapse/fullscreen, clamp it after content/viewport changes, and frame-bound drag updates. Focused
panel arrow keys move it by 20 px (50 with Shift); Home returns to the initial corner. Cancellation and unmount clear
queued motion. Keep the same calendar and session edits throughout. No public library contracts change.

Browser checks cover default/mobile geometry, card layering, corner fullscreen/focus, whole-body and touch dragging,
clamping and resizing, keyboard positioning, collapse/restore, inline contents and all titles, bottom navigation,
autoplay/reduced motion, manual takeover, and existing scene outcomes in both orientations.

## 133 - Introduce The Calendar Demo Before Its Chapters

Date: 2026-10-19
Status: Accepted; refines Decision 132's initial floating-panel content

Open the floating panel on a dedicated About this demo page explaining the live calendar, what the chapters
show, and how the guide relates to the working calendar. Keep this copy in `demo/concept/calendarIntroduction.json`.
The introduction contains descriptive paragraphs without a chapter recipe or playback toolbar. The first Calendar
scene continues its automatic background playback, subject to the existing reduced-motion and takeover guards.

Treat the introduction as the first presentation page before the manifest's eight scene chapters. Include it first
in bottom navigation and contents, with Previous disabled only on the introduction. Next opens Infinite scroll;
Previous from that chapter returns to the introduction. Contents can select either the introduction or any chapter.
Retain the same calendar and panel position through these transitions, collapse/restore and fullscreen. The scene
catalog and public package API remain unchanged. Geometry/state browser checks cover initial copy, contents order,
round-trip navigation, chapter-only controls, autoplay, fullscreen and retained calendar DOM identity.

## 134 - Keep Calendar Navigation In The Floating Guide Footer

Date: 2026-10-19
Status: Accepted; supersedes Decision 132's window-bottom bar and refines Decision 133's presentation navigation

Place Previous, page count/title, and Next at the bottom of the floating panel. They move with the panel and remain
visible when its description is collapsed, using compact arrows and a count. Keep navigation outside the scrollable
body so short displays retain reachable controls while explanations or contents scroll. Back and contents stay in
the panel. Remove the separate window footer and let the stable calendar fill the remaining viewport, including
fullscreen. Preserve introduction ordering, scene autoplay/takeover, position clamping, and calendar/session identity.

Browser checks assert footer containment and hit-test visibility at desktop, phone and landscape sizes, expanded
and collapsed states, dragging/resizing and fullscreen; they also verify full-height calendar geometry and existing
chapter/introduction navigation. No library contracts change.

## 135 - Start Calendar Chapters Without Hiding Their Explanation

Date: 2026-10-19
Status: Accepted; supersedes Decision 132's automatic collapse and chapter playback toolbar

Keep the Calendar explanation expanded when Previous, Next, or contents reaches a chapter. Start that chapter's
scene immediately from its authored initial state, respecting reduced motion and manual takeover. Remove Play tour,
Replay scene, Try it, Reset, and Pause controls from the Calendar guide. Revisiting a chapter runs it again; only
the explicit chevron collapses the text. Keep Decision 134's panel-footer navigation, introduction ordering, panel
position, mounted calendar, and session edits. Other products retain their playback controls.

Verify forward/back/contents arrival starts the scene with visible explanatory text, no toolbar, reduced-motion idle
behavior, manual interruption, retained edits, and existing real demo outcomes. Move the expanded guide clear of
vertical hover lanes when testing pointer hit targets, using its supported keyboard positioning.

## 136 - Loop The Selected Calendar Scenario Without Advancing Navigation

Date: 2026-10-19
Status: Accepted; refines Decision 135 and supersedes Calendar's finite scene completion in QUNO-023

Repeat the selected Calendar scenario until manual takeover, explicit navigation, product change, hidden tab, or
unmount cancels it. Automatic playback never selects another chapter or clicks Previous/Next. Ordinary authored
calendar interactions remain unchanged. Infinite scroll uses a dedicated JSON `scroll-loop` action with a positive
pixels-per-second speed: keep moving downward with linear frame-bounded deltas, without pauses or jumping back to
the starting date. Throttle the visible-date readout during continuous motion instead of waiting for scroll silence.

Other Calendar scenes repeat their authored steps with a short result hold. Restore presentation/navigation and a
checkpoint of pre-run session changes between cycles so creation does not accumulate unbounded automatic events or
block the next empty-slot gesture. Manual takeover keeps the currently displayed result and prevents future resets.
Changing chapters retains current session edits. A new selection starts its cycle observation at zero; completed
cycles are exposed only as demo-local data for browser checks. Other products retain finite playback and tour order.

Keep the informational panel expanded. Synthetic Calendar gestures temporarily exclude this panel from hit testing
only during their synchronous dispatch, restoring pointer styles before returning; native input still targets the
panel normally. This demo-only presentation adapter refines Decision 125's browser hit testing by excluding the
information overlay while retaining actual calendar card/lane ordering. It changes no library hit testing or public
contracts. Verify restored pointer styles, expanded-guide phone creation, vertical hover/move/create outcomes,
multiple cycles without chapter advancement, bounded automatic data, continuous forward dates, and cancellation
without delayed reset/resume.

## 137 - Make Calendar Scroll And Zoom Loops Lively

Date: 2026-10-19
Status: Accepted; supersedes Decision 136's steady scroll speed without pauses

Keep the selected chapter looping without navigation. Scroll down by 900 px in a one-second eased step, pause for
350 ms, then continue to later dates without resetting. Author amount, duration, easing and pause in `scroll-loop`
JSON; require at least 800 px per step. Retain cancellation during both movement and pauses.

Start Zoom at its maximum 8 scale. Animate out to minimum 0.5 in 700 ms, scroll 900 px through the wider schedule,
animate back to 8 in 700 ms, and scroll back through the detailed view. Use one-second pans and brief result holds.
Repeat that chapter with expanded text and the existing checkpoint/takeover rules. The same date axis scrolls
downward in both calendar orientations. Keep these choices in scenario JSON rather than branching on scene IDs.
Verify both zoom directions and extrema, live event/slider geometry, at least 800 px of animated travel with a
visible pause, forward dates across multiple steps, chapter persistence, and immediate manual cancellation.

## 138 - Require Deliberate Pointer Input To Take Over Playback

Date: 2026-10-19
Status: Accepted; supersedes Decision 125's real-pointer hover takeover and refines Decisions 136–137's interruption rules

Unpressed pointer movement and hovering over the Calendar must not cancel its demonstration or loop. Cancel on
trusted pointerdown, so a click or the start of a drag takes over immediately. Keep wheel, keyboard, focus and hidden
tab cancellation, explicit guide actions, navigation, and reduced-motion behavior. Native hover remains usable once
the visitor has deliberately paused playback. Remove the Calendar pointermove cancellation listener and its cleanup.

Verify repeated mouse movement over the live calendar leaves the cursor and playback running in both orientations;
a subsequent click or drag stops immediately and does not resume. Retain covered-lane native hover checks after
explicit takeover and synthetic overlap playback geometry/hit ordering. No public library contracts change.

## 139 - Demonstrate Next-Day Scrolling After Each Orientation Switch

Date: 2026-10-19
Status: Accepted; refines Decision 137's orientation comparison chapter

In Horizontal / vertical, switch to vertical, reveal the reference appointment and scroll into the next day. Switch
back to horizontal, reveal that next day's appointment, and scroll into the following day. Keep both transitions
and pans in the scene JSON using existing actions, without changing the calendar instance or chapter navigation.
Measure vertical travel from the calendar cell and use the authored horizontal next-day distance. Preserve looping,
expanded guide text, session edits, deliberate pointer takeover and other cancellation guards. Verify October 20
after the vertical pan and October 21 after the horizontal pan at desktop and phone widths, retaining the viewport
node and live playback. No public contracts change.

Decision 139 verification clarification: switching orientation replaces the inner viewport as designed by the
public component. Retain and verify the calendar workspace/canvas identity across this transition, superseding the
inner-viewport-node assertion above; scene and fullscreen navigation within one orientation retain their viewport.

## 140 - Fill The Demo Day With Varied Readable Appointments

Date: 2026-10-19
Status: Accepted; supersedes Decision 127's six-appointment default and refines Decision 126's title presentation

Use 22 appointments per day for ordinary concept scenes: five regular appointments per person plus the two
canonical overlaps on Maya's morning reference appointment. Spread additional appointments across morning, lunch,
afternoon and late afternoon within 08:00–19:00. Use 32 varied concise additional titles, shared by density subsets
and all Calendar scenes. Keep reference IDs, the first four morning appointments, the three-way overlap and Maya's
11:30–12:30 creation gap stable. Preserve the cached source, session edits, and exact 4/40/400 density choices.

Set ordinary and density scene zoom to 2, leaving Zoom's intentional 8-to-0.5 demonstration. Lengthen generated
regular appointments from 35 to 60 minutes; the original hour-long anchors and 75-minute canonical overlaps retain
their duration. This gives horizontal cards about 120 px at the authored zoom, while existing truncation and hover
remain available for crowded or narrow cases. Synthetic playback and native interaction still use the same data.

Verify working-hour coverage, per-person distribution, varied titles, hour-long geometry, stable IDs, creation gap,
density counts, cached identities, unclipped single-line titles at 2x in Busy/Packed, both orientations and existing
creation/move/view playback. Shared cursor styling is owned by QUNO-030. No library contracts change.

## 141 - Close Authored Scene Cycles Before Repeating

Date: 2026-10-19
Status: Accepted; refines Decisions 136–140's loop boundaries

Allow Calendar scenes to declare `loop: "continue"` when their authored actions close the cycle. Keep the pointer and
live state through the boundary rather than restoring a checkpoint. Theming explicitly ends with Light; density
scrolls back and selects Quiet; orientation comparison returns to October 19; zoom returns to its initial scale
and position. Reschedule moves three distinct appointments to the next person and later time, then returns all
three in reverse order before repeating. Preserve cancellation and pre-existing session edits. Creation retains
checkpoint restoration to bound automatic events. Other products keep finite playback.

Start Event density explicitly in horizontal mode regardless of the previously selected orientation. Clear the
synthetic hover when the pointer starts a non-hover action, so an expanded appointment closes as the cursor leaves
for scrolling, controls or dragging. Retain continuous hit-tested movement between explicit hover targets.

Browser checks cover the explicit final Light click, density orientation after a vertical scene, closed previews
during scrolling, three forward and three return moves in both orientations, return clocks, repeat progression,
and manual takeover without a delayed reset. No public package contracts change.

## 142 - Keep Calendar Changes Visible In Their Appointments

Date: 2026-10-19
Status: Accepted; supersedes Decision 127's contextual saved/moved confirmation

Remove the corner Saved/Moved status box from the concept calendar. The live appointment's title, time and resource
show creation and rescheduling results directly. Remove the unused message state and styling, and assert those
appointment results in browser checks. Before synthetic rescheduling, bring the source into the usable time area,
accounting for sticky participant labels and the drag offset on narrow screens. Verify all three appointments
return to their original clocks and people on phone, horizontal and vertical layouts, with no corner message.
No public product contracts change.

## 143 - Retain Floating Guide Width When Collapsed

Date: 2026-10-19
Status: Accepted; refines Decisions 132–135's collapsed presentation

Keep the floating guide's expanded width when its body is collapsed, including responsive widths and fullscreen.
Only reduce its height and padding; retain a readable chapter title and the contents action. Rename the chapter
and introduction contents button to All demos in both visible text and accessible name, including collapsed state.
The contents view still offers Back to return to its introduction or chapter. Keep footer navigation, drag position,
viewport clamping and session identity. Browser checks compare expanded/collapsed widths and title clipping across
desktop, phone and landscape sizes, and exercise All demos navigation. No public product contracts change.

## 144 - Use A Direct Contents Header And Left-Aligned Titles

Date: 2026-10-19
Status: Accepted; supersedes Decision 143's return button within contents

The Calendar demos contents screen has its title and collapse control without a Back button. Chapter and
introduction views retain All demos. Selecting a title, footer navigation or Escape leaves contents using the
existing behavior. Align every contents button at the left, using a fixed-width numeric marker so all demo names
share one start edge. Give contents alignment precedence over generic guide-button centering. Browser checks
assert the absent back control, computed alignment and shared title geometry, alongside responsive panel checks.
No public product contracts change.

## 145 - Show Only The Title And Expand Control When Collapsed

Date: 2026-10-19
Status: Accepted; supersedes Decision 134's collapsed footer and refines Decision 143's retained width

Keep the collapsed guide's responsive width, chapter name and expand control. Hide its All demos action, footer
navigation, recipe, explanation and contents list. Expanding restores those controls and the selected presentation
without resetting the calendar. Retain dragging and viewport clamping. Browser checks assert exactly one visible
button, no rendered contents action or footer, unchanged width, readable title and hit-testable expansion across
desktop, phone and landscape layouts. No public product contracts change.

## 146 - Start The Guide At Bottom Left And Keep Its Toggle Steady

Date: 2026-10-19
Status: Accepted; refines Decisions 132, 143 and 145's placement and disclosure geometry

Initially measure the expanded guide and place it at the bottom left with a 24 px inset, clamped to the existing
12 px minimum on constrained displays. Home returns it to that corner. Later disclosure and navigation retain its
position subject to viewport clamping; dragging remains available. Collapsing changes content and height while
preserving panel width, top padding and the toggle's 34 px size and screen position. Keep only title and expand
control when collapsed. Browser checks compare toggle rectangles exactly through disclosure, assert the initial
bottom inset at five sizes, and retain drag, resize, fullscreen, contents and native-hover coverage.
No public product contracts change.

## 147 - Explain The Calendar Concepts And Focus The Edited Doctor

Date: 2026-10-19
Status: Accepted; refines Decisions 133, 140 and 146's editorial content and creation demonstration

Rename the introductory presentation page Calendar. Use the author's first-person rationale for focus, scrolling,
zoom, underlying overlap hover, equivalent orientations, theming, density, creation and rescheduling. Keep each
chapter's existing identity, order, actions and recipe. Allow one to three paragraphs for Calendar JSON while
other products retain one or two. Saving/settled feedback describes consumer-owned presentation, not new native
EventRenderStatus values or a simulated server integration.

Declare `initial.focusDraft: true` on creation. While its controlled create/edit draft is open, display only the
selected doctor's row or column. Keep all four `loadCalendarIds` stable and retain the shared cache and session
edits. Capture the edited slot before opening/closing and restore it after the committed layout; Save and Cancel
restore the normal participant selection, while chapter/reset cancellation clears the draft. Other scenes retain
normal participant selection. Verify actual selected doctor IDs, visible drafts, date continuity, saved cards,
Cancel, both orientations, phone playback, repeated creation and responsive long-copy geometry. No public API changes.

## 148 - Anchor The Guide Below Its Content And Close Overlap Playback

Date: 2026-10-19
Status: Accepted; refines Decisions 125, 146 and 147, and adopts shared QUNO-032

Keep the explainer's left-bottom corner fixed as text, contents and disclosure change height. This supersedes
Decision 146's absolute toggle screen-position requirement: the toggle remains 34 px, at the same horizontal position
and padding, while the panel grows upward. Default bottom inset is 24 px. Put fullscreen at bottom right and compact
scenario controls immediately to its left; narrow dock scenes reserve footer clearance.

Render the Zoom explanation's Shift-scroll gesture as a keyboard tag. After hovering the three overlap cards, move
the demo cursor to the day label and hold all cards closed for 1500 ms. Preserve draft/drag chrome, show the existing
appearing state with a saved-card glint, and release cancelled drafts with the public 420 ms fade-out. No corner
confirmation message or new event status is introduced. Verify anchor geometry, unobstructed controls, outside-cursor
closed holds, computed glint/fade animation and reduced motion. Public Calendar contracts remain unchanged.

## 149 - Move Concept Drafts Before Saving And Simplify Control Chrome

Date: 2026-10-19
Status: Accepted; extends Decisions 147–148's concept interactions and control placement

Wire the public onActiveDraftMoveRequest callback in the concept editor. Cancel any previous anchor restoration,
apply the move only to the matching controlled draft and retain its current title/metadata. Save commits the moved
slot; Cancel discards it. Moving a draft never writes the saved-event overlay before Save.

Remove the small labels above view, density, theme and zoom controls, retaining accessible group names and the
existing buttons/slider. Keep every scene-control dock 40 px high, centered and aligned with the fullscreen control.
Verify live draft/editor clock changes, actual card movement, preserved titles and Save/Cancel in both orientations;
assert label absence, equal dock/fullscreen height and hit targets at desktop/phone widths. No public API changes.

## 150 - Pause Two Seconds Between Infinite Scroll Steps

Date: 2026-10-19
Status: Accepted; supersedes only Decision 137's Infinite scroll pause duration

Set the Infinite scroll scene's pauseMs to 2000, retaining its 900 px, one-second movement, easing, indefinite
continuation and manual takeover. Both orientations share this scene configuration. Verify an observed stationary
hold of at least 1900 ms between movements, allowing frame-sampling tolerance. Other scenes retain their pacing.
No public product contracts change.

## 151 - Follow System Appearance And Match The Demo's Effective Zoom Range

Date: 2026-10-19
Status: Accepted; refines Decisions 137 and 149 and adopts shared QUNO-037

Use initial.theme: system for ordinary Calendar scenes, resolving the computer's current light/dark preference
on mount and when it changes. Explicit Light, Dark and Branded scene/manual choices remain explicit. The Theming
chapter retains its Light → Dark → Branded → Light cycle. Changing chapters restores the authored preference.

Share the demo's hours and label geometry between its calendar settings and zoom controls. Observe the actual
viewport width and use max(0.5, available time width / displayed minutes), rounded upward to the next 0.01, as the
horizontal minimum; vertical minimum stays 0.5, maximum stays 8. Clamp rendered zoom to that range and disable
boundary buttons. Slider playback reads these native bounds. Cancel an out-of-range wheel request through the
public handle so the next reversed gesture need not wait for an unaccepted zoom commit. Resize/orientation changes
update limits without remounting or clearing edits. Verify native slider endpoints, wheel reversal at the minimum,
resize and orientation behavior, visible theme surfaces and live OS changes. No public API or library style change.

## 152 - Keep Creation Draft Text Legible In Dark Mode

Date: 2026-10-19
Status: Accepted; refines Decisions 148 and 151's demo-owned event presentation

In the dark Calendar palette, replace the creation draft's pale green fill with dark green and a light green dashed
border. Retain the light palette's original draft style, the regular themed event text, saved glint and Cancel fade.
This prevents light text disappearing on the draft's formerly fixed light background. Verify at least 4.5:1 title
and clock contrast for new, saved and hovered cards in both orientations and both palettes. No library styles change.

## Shared mobile explainer drawer — 2026-10-20

[QUNO-038](../shared/decisions.md#quno-038--use-a-mobile-explainer-drawer-with-adjacent-fullscreen) supersedes the shared
concept's mobile floating positioning and corner fullscreen placement. The drawer, chevron/fullscreen group and
responsive dock clearance belong to the demo; this product's public behavior and styles retain their contracts.

## 153 - Give Mobile Calendar Labels Thirty Percent Of The Viewport

Date: 2026-10-20
Status: Accepted; supersedes Decision 127's fixed horizontal label width on mobile and refines Decision 151

At concept widths up to 850 px, set the horizontal calendar's public labelWidth to 30% of its measured viewport
width. Share that value with the viewport-fitting zoom calculation so sticky names, dates, grid projection and
pointer targets use the same geometry. Recalculate on resize/fullscreen without remounting the calendar.

Scope mobile horizontal name text to 12 px (25% below 16 px) and date labels to 9.6 px (40% below 16 px). Desktop
retains its 238 px labels and original typography; vertical view retains its separate 167 px time pane and headers.
Verify width/font ratios, real grid alignment, fullscreen, the 850/851 px boundary, zoom limits and retained mounts.
These settings and styles belong to the concept demo; public defaults and other routes remain unchanged.

## 154 - Return The Orientation Tour To A Measured Day Heading

Date: 2026-10-20
Status: Accepted; refines Decision 139's return choreography for Decision 153's responsive label geometry

Replace the orientation tour's fixed -800 px return with a scroll to the starting day's non-sticky header band,
aligned to the viewport start. That day remains available in date overscan even when its first participant and
reference appointment have been virtualized away. Reveal the actual appointment only after its day is back.

Use the shared scroll-to action's optional start alignment, retaining center as the default for existing time
scenes. Keep the authored one-second motion, subsequent hover and loop hold. Verify both orientations complete
next-day pans and return to October 19 on desktop/phone, including repeated cycles. No library runtime changes.

## Shared mobile drawer overlay — 2026-10-20

[QUNO-039](../shared/decisions.md#quno-039--overlay-the-full-mobile-canvas-with-the-explainer-drawer) removes reserved
mobile stage space: the shared explainer overlays the full canvas without disclosure-driven product movement.
This updates demo presentation only; public component contracts and desktop layout remain unchanged.

## Shared mobile drawer playback — 2026-10-20

[QUNO-040](../shared/decisions.md#quno-040---keep-mobile-drawer-disclosure-independent-of-playback) keeps a running
concept demo playing through mobile header swipes and chevron disclosure, while paused scenes remain paused.
This updates shared demo takeover only; public product behavior and desktop guide interaction retain their contracts.

## 155 - Use Smaller Demo Date Windows With Stable Density Geometry

Date: 2026-10-20
Status: Accepted; refines the demo window and density behavior under Decisions 128, 147 and 153

Add optional settings.dateWindowRadius as a count of included dates on each side of the anchor. Keep the existing
month-before/month-after window when omitted or non-finite; finite values are truncated to at least one. Date-window
caches include this setting, and changes preserve the current semantic position. Both orientations and excluded
weekdays use the same timezone-free sequence. The concept Calendar and guide’s infinite-scroll exhibit opt into
seven dates per side (15 total) while normal consumers retain their existing default.

Keep all 400 fixture appointments in the demo-owned source cache, but load a 22-event baseline into the calendar’s
persistent cache. The selected density is projected synchronously from already-loaded fixture dates, with session
edits overlaid as before. Raw 400-event buckets outside the projected render range must not inflate offscreen day
heights in the ordinary scroll demo. Keep source appointment identities stable across range loads and density changes.

Verify default/month and explicit-radius sequences, excluded days, live radius changes, centered idle/autoplay
scrollbars and unchanged visible date offsets on desktop/phone. Keep density counts, edits and public projection
semantics intact; source fixtures and unrequested dates never bypass loading.

## 156 - Isolate The Embedded Density Exhibit From Concept Page Layout

Date: 2026-10-20
Status: Accepted; refines Decision 128’s lazy performance exhibit and the shared concept presentation

Render the Keep busy schedules fast exhibit as a block within its 560 px wrapper, so the concept shell’s 88 px
navigation grid cannot compress its calendar. Mark the embedded presentation explicitly and exclude it from the
old mobile-preview control-hiding rule. Only guided concept calendars reserve floating dock clearance above a drawer.

Verify full calendar height/width and contained, reachable Quiet/Busy/Packed controls at desktop and phone widths.
Preserve lazy mounting, the same public Calendar entry point, density counts and standalone concept drawer layout.

## 157 - Compare Realistic Shuffled Schedules At Four, Twenty And Sixty Events

Date: 2026-10-20
Status: Accepted; supersedes the 4/40/400 density presets and Decision 155’s 400-event source design

Use Quiet 4, Busy 20 and Packed 60 appointments per day across four resources. Generate one stable 60-event schedule
per loaded date, taking nested prefixes for each preset. Seed a small pseudo-random generator from the date and
scatter starts within four time bands so even Quiet spans the working day. Each resource receives 1, 5 or 15 events;
keep one-hour durations and working-hour bounds. There are no synthetic forced overlaps in this density fixture.

Keep density fixture IDs separate from the ordinary 22-event choreography, preserving its reference appointments,
creation gap and overlap tours. Retain the 22-event persistent baseline from Decision 155; synchronous projection
chooses the separate loaded density source and overlays session edits. Update controls, autoplay, guide comparison
cards, copyable generation recipe, documentation and tests together.

Verify exact daily/per-resource counts, four-band coverage, repeatability and variation across dates, stable nested
identities and no forced overlap records. Browser checks cover all three densities, card readability, looping and
full embedded layout. Higher-density algorithmic stress tests remain library verification rather than demo presets.

## 158 - Clarify Navigation And Interaction Focus In The Concept Introduction

Date: 2026-10-20
Status: Accepted; refines the concept introduction copy under Decision 147

Explain the navigation cost as too much mouse movement to navigate and the interaction cost as loss of focus during
interactions. Retain the first-person introduction, participant/meeting visibility concern and following approach
paragraph. Check the complete first paragraph on desktop and phone; calendar behavior and public contracts remain unchanged.

## Shared homepage and documentation routes — 2026-10-20

[QUNO-041](../shared/decisions.md#quno-041---promote-the-concept-homepage-and-preserve-field-guides) promotes the
concept to `/`, persists product/chapter navigation in the URL, and moves current field guides to `/docs`.
The pre-change guide source is retained at `/docs/archive`; public product contracts remain unchanged.

## 159 - Keep Documentation Density Light And Newly Drawn Availability In Its Layer

Date: 2026-10-20
Status: Accepted; refines Decisions 155 and 157 and the availability exhibit

Start the embedded Keep busy schedules fast exhibit in the guide's light palette, independently of the computer's
color scheme. The standalone concept keeps its system preference and the exhibit retains its theme control.
Apply the optional initial theme consistently on mount, scene reset and loop restoration.

The availability exhibit must set `renderLayer: "availability"` on newly created availability, matching its initial
fixtures. Kind alone does not select a background layer. This fixes a demo wiring regression: a created window
was classified as a foreground event, faded and inactive while editing availability. Preserve the deliberately
muted context in appointment mode and verify active layer, computed opacity/background and pointer interaction
in both orientations. This changes consumer-owned demo data, not the public layer contract.

## Shared directory routes and quiet documentation — 2026-10-20

[QUNO-042](../shared/decisions.md#quno-042---use-directory-routes-and-quiet-documentation-loading) replaces
query navigation with product/chapter directories, converts earlier shared links, removes archive discovery links
and keeps lazy documentation loading silent. Public product contracts are unchanged.

## 160 - Render Daily Event Segments And Drag By The Grabbed Time

Date: 2026-10-22
Status: Accepted; extends Decisions 011, 021, 028 and 096, and refines the runtime's start-date-only event indexing

Represent an event with its complete timestamp range and stable ID. Render the half-open range `[start, end)` on
every intersecting included date/resource, clipped to displayed hours. Use one segment calculation for committed
collision lanes, drafts, availability, previews and viewport rectangles. Midnight endings create no extra card.
Expose optional renderer `segment: CalendarEventSegment` with date, clipped minute bounds and continuation flags;
retain full events in every callback. Excluded dates hide portions without changing elapsed duration.

Load by overlap with inclusive date requests, including events beginning before the range. Retain complete events
across multiple immutable date buckets, updating all affected retained instances on edit/move/delete. Deduplicate
projection input/output by ID and segment projection output over rendered dates. Keep expansion bounded by retained
dates, the 120-date LRU and the existing request-generation/coverage rules.

At pointer-down retain the elapsed offset of the snapped date/time from the original start, including later-day
offsets. Move that grabbed time to the snapped destination, preserving original elapsed duration. Remove display-hour
clamping for all moved events, including originally same-day ones. Keep native browser-local clock resolution,
UTC proposal serialization, click thresholds, no-op returns, rejected drops, participant policy and controlled drafts.
Drawing remains single-day; grabbing an ending portion moves rather than resizes the event.

Registry identities include date/resource/event and retain simultaneous committed, draft and preview shells until
each unmounts. Captured anchors retain the resolved date and activation reports
optional renderedDateKey. Hover remains local to the segment while dragging affects the full event. Focus chooses
the first included date with a visible segment when the starting portion is hidden.

Demonstrate complete overlap-loading and segment rendering through the public entry point in the lazy field-guide
exhibit. Verify both projections' geometry/layers, begin/middle/end grabs, clipping, drafts, rejection, virtualized
identity, overlapping refreshes, bounded long spans and 23/25-hour duration across clock changes.

## 161 - Reuse The Guide Card Renderer For Multi-Day Events

Date: 2026-10-22
Status: Accepted; refines Decision 160's demo presentation

Use the field guide's existing ArticleEventCard for overnight and multi-day appointments, availability, drafts and
move previews. Pass a segment-specific time label through a small adapter, preserving clipped clocks and continuation
arrows. Keep the established card structure, typography, accent border, rounded corners, responsive content and
status styling. Remove the example's separate inline card design. Verify computed appearance against the read-only
exhibit and retain movement coverage in both orientations. Public package contracts and library styles are unchanged.

## 162 - Retain The Exact Time And Screen Point Across Zoom Reversals

Date: 2026-10-22
Status: Accepted; supersedes Decisions 118–121's nearest-tick and idle anchor recapture behavior, and refines Decision 124

Capture the exact unsnapped time under the first Shift-wheel sample, including an outward sample at a limit.
Keep that semantic date/time and screen coordinate while Shift remains held, across pauses, controlled-request
expiry and rejected out-of-range requests. Native content bounds may move it temporarily; reversing zoom restores
the original point as soon as the bounds permit. Shift release, ordinary scrolling, navigation, resize, blur or an
external zoom value ends that input anchor. An explicitly cancelled request acknowledged within its original
expiry by a value between the previous scale and requested scale retains the same focus; this supports consumer
minimum/maximum clamps. The 300 ms overflow unlock remains housekeeping, independent of anchor lifetime.

Slider/external zoom in either orientation anchors the current clock on the focused visible date. Preserve its
visible screen position; when offscreen, target the usable viewport center. Prefer the current top date when its
clock is visible, then another visible clock. If the clock falls outside displayed hours, retain the existing
center/origin or vertical fraction fallback. Retain this semantic anchor across successive values, including bounds,
until a viewport takeover. Preserve controlled request pacing and before-paint geometry/scroll commits.

Verify fractional pointer times, extreme reversals and pauses in both orientations, native content clamping,
iPad-emulated slider focus in Chromium/WebKit, dense frame geometry and existing delayed/rejected request behavior.
No public API changes.

## 163 - Require A Touch Hold Before Moving Or Drawing Events

Date: 2026-10-22
Status: Accepted; refines Decisions 011 and 028's pointer activation without changing movement proposals

Wait 350 ms for a stationary primary touch before starting event movement or empty-grid drawing. Allow up to eight
pixels of initial touch jitter; movement beyond that, native scroll, pointer cancellation, a second pointer, Escape,
blur or unmount cancels the pending hold. Before activation, leave native panning and default touch behavior available.
After activation, capture the pointer and prevent native touch movement until release/cancellation. Do not reserve
all card touches through touch-action: none. Mouse and pen retain immediate activation and existing drag thresholds.

A quick stationary event tap retains the four-pixel movement threshold and still invokes onEventActivate with full
event/date/resource identity; an empty-grid
tap creates no event. Availability, controlled drafts, mutation permissions, rejection and grabbed-time anchoring
use the same lifecycle. Delayed activation snapshots the pointer coordinates and capture target before React clears
its event currentTarget. Verify timer/cancellation cleanup and native Chromium touch panning, held drag geometry and
drawing in both orientations. No additional public setting or resize gesture is introduced.

## 164 - Build The Demo Server Without Generated Package Assets

Date: 2026-10-22
Status: Accepted; refines Decision 111's server build boundary after Decision 160 introduced shared overlap filtering

The focused demo and function build commands must work before library assets exist. Resolve the public headless
root and its private shared dependencies directly from source when bundling the query service. Keep the native
private service import's source typing in its package `types` condition and its built JavaScript in `default`.
Remove the TypeScript path override that caused Vite configuration bundling to traverse query source before
application aliases were available. Preserve explicit source aliases for tests and normal application bundling.

Prepare the service before development startup as well as site/function builds. Server fixture/query edits take
effect after restarting the development server. Keep the server bundle outside browser assets and published package
files, retain atomic publication for concurrent builders, and add no prerequisite full-library build. Test both
build commands in an isolated checkout without `dist`, then execute the built service through native Node imports
in two timezones. No public component, loader, event or package export contract changes.

## Shared documentation presentation — 2026-10-24

[QUNO-043](../shared/decisions.md#quno-043---share-left-aligned-navigation-and-system-themed-documentation) owns the shared header, browser-driven editorial appearance and
desktop supporting column. This product retains its public contracts and authored interactive examples.

## Shared section reading order — 2026-10-24

[QUNO-044](../shared/decisions.md#quno-044---keep-guide-sections-in-reading-order-with-one-instruction) refines QUNO-043 with one instruction aligned to the full description,
demos before implementation recipes, and shared-header-only demo navigation in current guides. This product's
public contracts, interactive examples and archive presentation remain unchanged.

## 165 - Isolate Density Guide Typography From Editorial Text

Date: 2026-10-24
Status: Accepted; extends Decision 156’s embedded presentation boundary

Give the busy-schedule exhibit its own 16 px base and normal line height rather than inheriting the article’s
20 px body and 1.72 line spacing. Match other guide calendars with compact 13 px single-line date labels, retaining
the existing 9.6 px phone treatment. Constrain overflow with ellipsis so long dates remain inside their header.

Scope the reset and label styling to this exhibit. Verify text bounds, computed size/line height, no wrapping or
vertical clipping, and all three density choices on desktop/phone under light/dark browser preferences. Preserve
the 560 px exhibit, its light calendar palette, responsive labels and public component styles.

## Shared clean-test startup — 2026-10-24

[QUNO-045](../shared/decisions.md#quno-045---keep-test-startup-independent-of-demo-server-builds) extends the
verification around Decision 164 with a dedicated Vitest configuration. API tests resolve the query service from
source without loading the demo middleware or requiring generated assets. Deployed native imports stay unchanged.

## Shared mobile width bounds — 2026-10-24

[QUNO-046](../shared/decisions.md#quno-046---keep-the-main-demo-within-the-available-mobile-width) keeps the guided
main demo inside the available mobile width through rotation and interaction, including layout viewports below
320 px. This shared demo presentation does not change the public component’s styles or contracts.

## 166 - Ignore Uncommitted DOM Positions During Layout Changes

Date: 2026-10-24
Status: Accepted; refines Decision 116-runtime’s single viewport authority and Decision 117’s commit model

Before every layout change, flush only native scroll observations captured before React mutated the DOM. Do not
read the viewport’s current scroll offset at that point: a superseded commit may leave it at the previous geometry
revision even though the engine has already navigated or recentered. Reinterpreting those pixels against the new
geometry can shift the displayed date by one week after row filtering. Retain actual DOM reads for browser input,
settlement and committed clamp observation. This extends the existing zoom-safe flush to ordinary layout changes.
Disable native CSS scroll anchoring in the virtual viewport as well, so the browser cannot apply another correction
after the engine has preserved its semantic anchor.

Regress a skipped commit followed by expired navigation ownership and a parent layout change, preserving date and
committed scroll position. Exercise row contraction, expansion and idle recentering under sixfold Chromium CPU
throttling, plus normal navigation, zoom, draft and compatibility coverage. The optional stylesheet carries the
anchoring policy; no public API changes.

## Shared statistics presentation — 2026-10-24

[QUNO-048](../shared/decisions.md#quno-048---keep-statistics-free-of-instructions-and-list-actual-dependencies)
removes Try it notes from static statistics blocks and lists only actual dependencies, omitting an empty row.

## Shared demo recipe navigation — 2026-10-25

[QUNO-049](../shared/decisions.md#quno-049---keep-recipe-links-out-of-demo-popups) removes the recipe link from
demo popups. Implementation recipes remain accessible through Documentation in the shared header.

## 167 - Explain The Horizontal Timeline In The Infinite Scroll Chapter

Date: 2026-10-25
Status: Accepted; refines Decision 147's concept explanations

Follow the infinite-calendar paragraph with the rationale for a horizontal timeline: fitting more calendars on
screen and giving appointment cards more room for natural text flow. Combine the previous wider-card sentence
with this explanation. Keep the chapter's scrolling demonstration unchanged.
