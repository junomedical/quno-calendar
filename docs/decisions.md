# Decision Log

## 001 - Greenfield Vite React TypeScript
Vite keeps the PoC lightweight while still supporting strict TypeScript, Vitest, and Playwright.

## 002 - View Components Behind CalendarRoot
The root component owns shared calendar inputs and delegates rendering to view components. This keeps future day/week/resource views possible without rewriting event renderers.

## 003 - Async Range Loader
The infinite view requests only visible date ranges. This better represents production-scale datasets than requiring all events upfront.

## 004 - Parent-Validated Mutations
Drag/drop previews are local, but accepted data changes must come from the parent through callbacks. This keeps persistence, permissions, and conflict rules outside the rendering component.

## 005 - Renderer Receives Event Status
The event renderer handles `existing`, `hovered`, `drop-preview`, and `new` states. This lets product-specific appointment cards render all interaction states without depending on calendar internals.

## 006 - Controlled Zoom Changes
Zoom remains parent-controlled through settings, and the infinite view requests changes with `onZoomChange`. This keeps wheel gestures, sliders, and any future external zoom controls synchronized without making the view own application state. The PoC uses a `0.5-8` slider and clamps wheel/settings zoom to that same range. High zoom should reveal finer timing, so the grid and time labels switch from 15-minute to 5-minute cadence only after zoom is greater than `6`.

## 007 - Sticky Labels Use Native CSS
The top time scale and per-day date labels use native CSS sticky positioning. Date labels stick on both the top and left axes, while calendar row labels stick on the left axis. This keeps labels visible during vertical and horizontal virtual scrolling without extra overlay synchronization.

## 008 - Documentation Is Part of Each Behavioral Change
Behavioral and API changes must update the relevant Markdown files: architecture/API notes, usage examples, decision log, test plan, and changelog. `AGENTS.md` records this as an implementation rule for future agent work in the PoC.

## 009 - Created Drafts Update The Visible Cache
The infinite view keeps a loaded visible-range cache, so parent state changes alone may not be visible until a reload. After `onEventCreateRequest` resolves, the view inserts the returned created event, or a local draft copy, into the loaded date bucket so the new event appears immediately.

## 010 - Current-Time Marker Uses The Timeline Coordinate
The sticky top pin and per-day current-time lines use the same natural timeline x-position. This keeps the red marker connected and moving at the same rate as the time grid when the timeline is horizontally scrolled.

## 011 - Events Can Belong To Multiple Calendars
Events support optional `calendarIds` in addition to the backward-compatible `calendarId`. The infinite view renders one instance in each matching selected calendar row. Hover focus is local to the row instance under the pointer, while drag and drop-preview state is keyed by event id so all visible instances move together.

## 012 - Row Labels Are Neutral, Event Cards Carry Color
Calendar row labels do not use colored left strips. Event cards carry the color code with a thicker left border via `--event-accent`, which better matches the reference appointment-card design and keeps resource labels visually quieter.

## 013 - Dense Overlaps Grow Rows
Compact rows default to 50px. Overlapping rows grow on a fixed ladder, but the final height is also clamped to at least 24px per overlap lane. Resting event shells are inset 2px from the top and bottom of their mini-lane, so dense event shells stay at least 20px tall and neighboring resting lanes do not touch. Hovered event shells expand to the full calendar row lane height with a higher z-index, matching the interaction design where the focused appointment becomes readable without permanently resizing the row.

## 014 - Date Headers Overlay The Time Scale
The time scale is sticky only on the top axis. Day date headers are sticky on the top axis, but only the left date label stacks above the time scale; the full-width gray day band stays below it so hour and minute labels remain visible. Calendar row labels also stack above horizontally scrolled timeline content. This lets native CSS sticky positioning make left labels cover scrolled timeline content instead of using JavaScript-driven clipping.

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
Rebuilding the virtual window must preserve both the top visible date and the pixel offset inside that date. Snapping back to the date header makes scroll-end recentering visible, so pending scroll targets store `{ dateKey, offsetWithinDate }` and restore the exact offset after the month window is rebuilt.

Native scrollbar-thumb dragging can complete without another React scroll callback after release, so the view also listens for the browser `scrollend` event and recomputes the top visible date synchronously before recentring. Even if the date is already the current anchor, the view still scrolls back to the anchor's centered offset so the scrollbar thumb resets.

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
New-event drafts are visual overlays in the target row. They do not enter committed row event lists, overlap lane assignment, row-height metrics, or virtual day resizing while the pointer is moving. Once creation is accepted and inserted into loaded events, the committed event participates in normal row layout recalculation.

## 033 - Infinite Views Are Named By Time Orientation
The original infinite view is now `view="infinite-horizontal"` because time runs horizontally. The new calendar-column view is `view="infinite-vertical"` because time runs vertically inside each date. The legacy `view="infinite"` stays as an alias for the horizontal view so existing callers keep working.

Vertical calendar columns start at a `240px` minimum, fit up to three parallel events, and then grow by `80px` for each additional overlap lane. This keeps the normal column width generous while making dense calendar/day combinations grow predictably. The vertical date and doctor-name row uses native per-day sticky positioning rather than synchronized overlay state, and the left date/time pane is 30% narrower than the horizontal row-label pane. The vertical timeline adds an 8px gutter before the first hour and after the last hour so labels and events do not touch the board edge. The time pane is sticky only on the left axis so its labels move vertically at the same pace as events.
