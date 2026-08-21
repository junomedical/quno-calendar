# Decision Log

## 001 - Greenfield Vite React TypeScript

Vite keeps the PoC lightweight while still supporting strict TypeScript, Vitest, and Playwright.

## 002 - View Components Behind CalendarRoot

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

Reusable infinite-calendar styles live with the infinite view and are imported by that module. Demo app chrome and the demo event card keep their own styles outside the library. This keeps the package closer to a reusable component library instead of a demo page with one global stylesheet.

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

The original infinite view is now `view="infinite-horizontal"` because time runs horizontally. The new calendar-column view is `view="infinite-vertical"` because time runs vertically inside each date. The legacy `view="infinite"` stays as an alias for the horizontal view so existing callers keep working.

Vertical calendar columns default to a `240px` minimum, fit up to three parallel events, and then grow by `80px` for each additional overlap lane. These values are parent-owned settings so product surfaces can choose compact or wide column rules without changing library internals. The vertical date and doctor-name row uses native per-day sticky positioning rather than synchronized overlay state, and the left date/time pane is 30% narrower than the horizontal row-label pane. The vertical timeline adds an 8px gutter before the first hour and after the last hour so labels and events do not touch the board edge. The time pane is sticky only on the left axis so its labels move vertically at the same pace as events.

## 034 - Demo Variants Stay Outside Calendar Internals

Additional demo routes are implemented as self-contained parent components over `CalendarRoot`. Each variant folder owns its settings, selected defaults, interaction mode, app chrome, and external event renderer, while sharing only deterministic event data helpers and keeping reusable calendar internals unaware of product treatments.

## 035 - External Popups Own Create And Edit Forms

The reusable calendar reports create/edit intent but does not own product form UI. `onEventDraftRequest` delegates drawn creation to the parent, `onEventActivate` reports clicked events for editing, and `activeDraft` renders one parent-owned create/edit preview. Edit previews filter out the loaded source event and render the draft in its proposed position, preserving popup-owned save/cancel semantics without mutating loaded data. The drawn-create local draft is cleared one animation frame after delegation so the parent-controlled draft can take over in the same visible position. While an active draft is present, new grid drawing is blocked and only that draft remains draggable; `onActiveDraftMoveRequest` lets the parent update popup state from drag proposals. Multi-calendar active drafts move as a block so participant edits remain the source of calendar membership changes. Selected-calendar changes refetch visible ranges without clearing the previous event cache first, so draw-to-popup filtering does not create a blank frame. If participant filtering removes every selected calendar while a draft is active, the calendar retains the last non-empty draft rows or columns as hidden inert placeholders so the virtual layout does not collapse. The default demo asks its range loader for the full selected calendar set while an external draft filters visible rows, because cancel expands those rows again and should not display empty calendars while the filtered range refetches. The demo popup sits above the calendar current-time marker because editing controls should remain visually and interactively primary while the form is open. The parent owns participant-filtering policy, save latency, validation errors, whether edit opens keep current calendars visible, how empty participant lists disable save, whether visible row-only changes and visible cancel restores avoid date/time centering, whether create cancel restores the drawn calendar row inside the date after visible calendars expand again, whether create cancel after participant additions still targets the originally drawn participant row, whether a repeated draw on that same date/calendar row keeps the new popup draft at the same viewport-relative row position, whether edit cancel returns to the original first person's event instance, whether date edits move naturally when the destination is already visible, and whether a form change avoids scrolling a visible draft or restores an offscreen draft to its last seen viewport-relative position. Parent restore logic should cancel delayed corrections once the user manually scrolls or once a newer draft geometry edit makes the pending correction stale, but should ignore virtualizer relayout scrolls that do not follow a user scroll gesture. Exact anchor corrections can still use an offscreen event element, which keeps dense draw-to-popup handoffs focused when participant filtering shrinks the day heights before the replacement draft is visible. If a layout expansion temporarily unmounts the target, the restore falls back to date/time navigation immediately and then keeps delayed exact-correction retries for measurement settling; this prevents wrong-date flashes before the idle recenter runs. Starting a new restore cleans up the previous manual-scroll cancellation listener so a stale cancel restore cannot invalidate a newer draw handoff. The library owns the viewport-anchor and active-draft release mechanics through `CalendarNavigationHandle` so parent forms can capture an event or slot before changing state, fade out a released draft shell, restore a replacement target after render, and cancel stale corrections after manual scroll without querying internal DOM. This keeps product forms agnostic of horizontal versus vertical geometry while still preserving create/edit/save/cancel positioning.

## 036 - Large Files Split By Ownership Boundary

Timeline gesture state is shared by horizontal and vertical views through `useTimelineInteractions`; each view keeps only orientation-specific geometry, hit-testing, and rendering orchestration. The default demo keeps product popup behavior outside the calendar library through `useExternalEventDrafts` and `ExternalEventPopup`. Playwright specs are split by behavior so coverage can grow without returning to one oversized scenario file.

## 037 - Package Surface Is Explicit

The public package entrypoint exports `CalendarRoot`, public API types, `defaultTimelineSettings`, and event membership/move helpers. Concrete infinite view components and draft internals stay internal so consumers depend on the stable shell instead of orientation implementation files.

## 038 - Release Build Separates Library And Demo

The library builds to `dist` with ESM, UMD, generated TypeScript declarations, and a package stylesheet subpath at `quno-calendar/styles.css`. The demo builds separately to `dist-demo`, keeping package verification focused on the artifact consumers install.

## 039 - Low-Risk Surface Props Stay View-Agnostic

`className`, `style`, `ariaLabel`, and `initialDateKey` are accepted by the shared calendar prop contract and forwarded by both orientations. `initialDateKey` only changes the initial virtual anchor; if omitted, the previous `now`-based anchor remains the default.

## 040 - View Orchestration Uses Focused Hooks

Shared setup, hit-testing, wheel zoom anchoring, drag lifecycle, and draft lifecycle live in focused modules rather than inside orientation render coordinators. Decision 050 supersedes the former technical `hooks` bucket with responsibility-domain ownership.

## 041 - The Example Is A Public Integration Field Guide

The single `/examples/integration-walkthrough` route connects product needs to recipe-sized live exhibits. Its source
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

The library emits an explicit `quno-calendar/styles.css` asset. ESM and CommonJS JavaScript imports do not touch `document`, which keeps package loading safe in Node and SSR environments. Library date operations use tested local-date and `Intl` helpers instead of a runtime `date-fns` dependency; the demo may keep development-only fixture utilities without increasing the consumer bundle. The declared `@tanstack/react-virtual` dependency remains an external package import instead of being copied into the library artifact, preventing duplicate virtualizer code in consumer applications.

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

Event focus is exposed both as a keyed `focusRequest` and as `CalendarNavigationHandle.focusEvent`; both use one
`CalendarRoot` coordinator above the orientation views. The caller supplies a complete event, avoiding an event-id
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

Imports that cross from a nested infinite-calendar domain back to the `src/lib` root use the single `#calendar-internal/*`
alias. Imports within the same feature folder remain relative. One root alias removes fragile `../../../` traversal
without inventing a separate alias for every responsibility folder, and the architecture check prevents deep relative
imports from returning. Its explicitly private name distinguishes it from the exact `quno-calendar` demo alias, which
exercises only the package's public entrypoint and does not expose internal subpaths. TypeScript resolves the mapping
relative to `tsconfig.json` without the deprecated `baseUrl` option, while the demo/test Vite config and library build
resolve the same mapping. `vite/vite-env.d.ts` supplies Vite's ambient asset declarations so strict editor diagnostics
also recognize side-effect CSS imports.
