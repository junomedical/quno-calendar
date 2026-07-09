# Test Plan

## Unit Tests

Vitest unit tests live in `tests/unit` and mirror the source module grouping.

- Date virtualization with excluded weekdays.
- Virtual scroll window behavior remains covered through existing date virtualization unit tests and Playwright scroll tests after extraction into `useVirtualTimelineWindow`.
- Time-to-pixel conversion, vertical time-to-pixel conversion, zoom, and snap interval.
- Event overlap lane layout, 50px compact row height for one or two lanes, stepped overlap growth from three lanes onward, at least 24px lane slots, and at least 20px visible resting event shells for dense groups.
- Vertical overlap column layout, default 240px base column width, three-lane fit, +80px growth for each additional overlap lane, and custom caller-provided column sizing rules.
- Row-height growth remains local to the dense date/calendar row instead of inflating every loaded day.
- Availability events are excluded from row-height growth and overlap calculations.
- Availability editing mode switches pointer activity from appointments to availability blocks.
- Generated appointments stay inside the primary calendar's generated availability window.
- Async range loading de-duplicates committed events by id when a range response includes already-loaded dates, so reloads do not add overlap lanes or grow rows.
- Multi-calendar event membership and move application.
- Active edit drafts replace their source event id while create drafts do not remove loaded events; draft overlays do not add overlap lanes, row-height growth, or vertical column-width growth.
- Newly committed visible events receive `status="appearing"` briefly after save/create, and the default demo card renders a 70px hard-edged diagonal white glint over that appearing status with a 485ms sweep.
- Save-triggered range reloads only mark ids provided in `appearingEventIds` as appearing; unrelated reloaded created events remain `existing`, and the same active requested id is consumed once rather than replaying on later range responses.
- Imperative visible-event commits replace or insert one saved event in the loaded visible cache without calling `loadEvents`, and can mark that event as appearing.
- External save patches the committed event into the visible cache instead of showing a released save draft or invalidating the range, avoiding double glints and reload jumps. Manual scrolling immediately after save is not pulled back by delayed anchor corrections.
- Deterministic demo event generation distributes events across every demo calendar.
- Pointer hit-testing, move proposal calculation, and draft creation.
- Public package entrypoint exports only the supported surface and does not expose concrete infinite view internals.
- `className`, `style`, `ariaLabel`, and `initialDateKey` work through `CalendarRoot` in both orientations.

## React Tests

- Calendar root renders the infinite horizontal view, the infinite vertical view, and the legacy `view="infinite"` alias.
- Fixed labels, the visible single sticky top time scale, same-row CSS-sticky date labels, current-time line alignment, controlled zoom callback, and custom event renderer contract are present.
- Date labels share the same sticky header row as the time scale, and active availability blocks do not cover calendar row labels.
- Event renderer receives status information.
- Controlled active edit drafts render through the event renderer while the loaded source event is hidden.

## Playwright Tests

Playwright coverage is split by behavior under `e2e/specs`: core navigation and interaction smoke tests, sticky/layering tests, event rendering tests, external popup draft tests, and vertical-orientation tests. Shared browser helpers live in `e2e/helpers.ts`.

- Initial demo render.
- Demo routes `/demo1`, `/demo2`, and `/demo3` render distinct calendar compositions using route-specific settings, view defaults, and event-card styles while `/` remains the original demo; each variant still supports live orientation and interaction-mode switching.
- Demo sidebar rendering stats populate frame redraw time, visible event DOM-node count, and total rendered calendar DOM-node count.
- Vertical virtual scrolling changes visible dates.
- Rendered day DOM nodes are pruned to the visible viewport plus five day sections of overscan.
- Vertical scrollbar dragging is bounded to one month before/after the visible date and recenters around the new visible date only after the idle recenter delay following scroll end.
- Scroll-end recentering preserves the intra-day pixel offset, so a user scrolled partway into a date stays partway into that same date.
- Native scrollbar-thumb completion leaves the scrollbar thumb near the released edge briefly, then resets it near the center of the rebuilt virtual window after the 1.2s idle recenter delay. Large horizontal-view date jumps also recenter after idle when the immediate scroll event fires before new virtual items are mounted.
- The `0.5-8` zoom slider and `Shift` + wheel change timeline scale without also scrolling the browser window; a multi-wheel `Shift` gesture keeps the first focused rendered time-grid node anchored when scroll range allows it, captures immediate trailing wheel momentum after Shift is released, and then allows normal wheel scrolling again.
- Horizontal rendering applies a viewport-fill floor so the timeline board does not become narrower than the available viewport width even when an incoming prop value falls below that floor; wheel gestures still stop at the slider minimum.
- Zoom values above `6` switch the timeline row grid and time labels from 15-minute to 5-minute cadence.
- Dense zoom levels progressively hide minor time labels so 15/45 disappear first and minute labels disappear entirely before labels overlap.
- Sticky-header visual artefacts are covered: dates stay pinned to the top, the absolute day-header band does not create an extra visual row or overlap the first calendar row, day header background fills across the timeline below the time scale, sticky date labels and calendar row labels cover horizontally scrolled timeline content through CSS layering instead of JavaScript clipping, visible hour/minute labels remain painted above the day band at high zoom, current-time markers stay out of date/calendar names while layering above calendar data and the gray day band, and calendar cells share one 1px gray border color without doubled sticky-label seams.
- Dataset scale can switch to 20,000 events per year.
- Large dataset scales keep events visible and hoverable instead of clustering into a few calendars.
- At 20,000 events/year, hovering visible events keeps them visible and rendered row heights vary locally according to overlap density.
- Overlapped cards expand to the full calendar row lane height on hover while resting shells keep a 4px mini-lane gap.
- Visible day boxes do not overlap adjacent date rows when variable row heights are measured.
- Availability renders as a background layer while draft/new event drawing can occur on top.
- Availability editing mode makes appointments inactive background blocks, supports drawing new availability, and supports dragging an existing availability block.
- Event cards include a visible `H:mm–H:mm` time range line.
- Compact event cards hide the time line when three lines do not fit and reveal it once the card has enough hover-expanded height, including single non-overlapping events in compact rows, without reducing hover typography, changing vertical text alignment, or hiding title icons.
- Date navigation can jump to a specific date and back to today.
- Date/time navigation can jump vertically to a date and horizontally to a requested time.
- Vertical `Shift` + wheel zoom anchors to the closest rendered in-range time node even when the pointer sits below the configured timeline end.
- Calendar count changes preserve the visible day and the intra-day offset while day height changes, and reducing calendars clamps any too-large offset inside the same active day. Active draft participant filtering pins the draft date into mounted virtual items and keeps a mounted draft target available for viewport-position restoration without replacing the current scroll anchor.
- Drawing a new event area renders an opaque uncapped-width draft with visible time text without changing row height, lane layout, or committed row event count, then delegates to the external popup in the default demo and leaves the saved event visible after popup save. Drawing a create draft in a row with two saved overlaps keeps the saved row at the compact two-lane height after popup handoff. Editing one event in a three-overlap row filters the source before metrics, so the draft replacement leaves only two committed overlap lanes and the row drops to the compact height.
- External create/edit popup flows update `activeDraft`, drawn create drafts stay at the same viewport-relative position on the first animation frame when the popup opens and other calendars hide through the public viewport-anchor handle, create participant selection limits visible calendars to selected participants without parking a visible draft in the viewport center, participant filtering keeps the previous event cache visible while the selected-calendar refetch resolves, filtered create drafts keep the full selected-calendar event range warm so cancel expansion does not show empty rows before content reloads, dense 5,000-events/year draw-to-popup handoff keeps the replacement draft focused even when row filtering shrinks the virtual scroll range, empty participants disable save and retain hidden inert placeholder rows/columns instead of collapsing draft layout, visible same-date time edits do not scroll the calendar, visible date edits move the draft to the visible destination date without scrolling, offscreen date edits and other offscreen field edits restore the draft to its last seen viewport-relative position, newer visible date edits cancel stale offscreen restore corrections, active draft dragging updates popup time fields, multi-calendar active drafts drag as one block, drawing a different range is blocked while a popup draft is open, delayed popup save disables the form and can show a bottom error while keeping the draft editable, popup save keeps the saved event in the draft's position through a single visible-cache commit, vertical popup create save renders the persisted event through the same visible-cache commit, edit opens without immediately filtering calendars, edit cancel restores the original event in the original first person's draft position even after participant edits, create cancel fades the released draft shell out and keeps the drawn calendar row inside the date at the same viewport-relative position when participant rows expand again, create cancel after participant additions restores the originally drawn participant row rather than the first visible draft instance, including Bhuvin-to-Marco-and-Surgery-B expansion in the 5,000/year dataset, future-date create cancel after adding several participants does not flash to earlier dates before the idle recenter, drawing again on that same date/calendar row after cancel keeps the new popup draft at the same viewport-relative row position, immediate wheel/manual scroll after cancel or popup handoff cancels pending restore corrections, the popup layers above the current-time marker, and the calendar viewport remains scrollable while the popup is open.
- Multi-calendar events focus only the hovered row instance, while dragging renders drag/drop previews in every proposed row. Dropping an accepted move onto another visible day keeps the visible event cache populated instead of clearing and redrawing the full calendar range.
- Drawing and drag/drop clear existing browser text selection, suppress new selection, and suppress other event hover effects while the interaction is active.
- Event resize/focus changes are not animated.
- Event cards show a thick left accent border, standard card backgrounds use a muted version of the same accent color, and row labels remain uncolored.
- Dragging an event produces parent-side accept/reject feedback.
- Demo calendar-type switch changes between infinite horizontal and infinite vertical views.
- Infinite vertical columns fill available space, follow `verticalColumnMinWidth`, `verticalColumnOverlapCapacity`, and `verticalColumnOverlapGrowth`, and keep default 240px/three-lane/+80px behavior when callers do not override those settings.
- Infinite vertical date/doctor headers remain sticky at the top, and widened date/calendar columns keep their doctor-name header cells aligned.
- Infinite vertical date labels render about 25% smaller than horizontal date labels, with weekday on a second line.
- Infinite vertical time pane and date cell remain sticky on the left during horizontal scroll, with the left pane 30% narrower than the horizontal-view label width.
- Infinite vertical time labels move vertically at the same pace as event columns and do not stick independently from the grid.
- Infinite vertical time labels render hours as `H:00` and minor labels as minute numbers.
- Infinite vertical first and last hour positions keep 8px of padding inside the day board.
- Infinite vertical zoom increases day/time height and uses the shared adaptive time-label cadence.
- Infinite vertical zoom changes keep the current visible date anchored, including large zoom-out changes from late in the day and gesture zoom that keeps the nearest rendered date/time node anchored while virtual day height changes and after the scroll-idle recenter delay.
- Infinite vertical current-time marker renders as one horizontal line on today only when `now` is inside enabled hours.
- Infinite vertical hovered appointments expand to the full calendar column width and a minimum readable height for three-line cards.
- Infinite vertical hover can pass through an expanded card to focus another underlying overlap lane.
- Infinite vertical draft creation, event dragging, availability mode, and multi-calendar status behavior match the horizontal interaction contract.
- Example routes mount for read-only, drag/create, vertical planner, availability editing, and controlled draft flows.
- Demo sidebars expose source links for public review.

## Release Checks

- `npm run typecheck` validates library, demo, examples, tests, and configs.
- `npm run lint` runs ESLint with TypeScript and React Hooks checks.
- `npm run build:lib` emits ESM, UMD, declarations, and a package stylesheet subpath.
- `npm run verify:package` packs the library, installs it into a temporary Vite React app, imports `quno-calendar` plus `quno-calendar/styles.css`, and builds the app.
- CI runs install, typecheck, lint, unit tests, Chromium Playwright tests, and package verification.

## Manual Checks

- Horizontal scroll keeps row names and date labels fixed on the left.
- Vertical horizontal scroll keeps the time pane fixed on the left.
- Overlapping events expand on hover and come to the front.
- Rejected moves revert after drop.
