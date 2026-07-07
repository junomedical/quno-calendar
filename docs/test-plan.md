# Test Plan

## Unit Tests
Vitest unit tests live in `tests/unit` and mirror the source module grouping.

- Date virtualization with excluded weekdays.
- Virtual scroll window behavior remains covered through existing date virtualization unit tests and Playwright scroll tests after extraction into `useVirtualTimelineWindow`.
- Time-to-pixel conversion, vertical time-to-pixel conversion, zoom, and snap interval.
- Event overlap lane layout, 50px compact row height, stepped overlap growth, at least 24px lane slots, and at least 20px visible resting event shells for dense groups.
- Vertical overlap column layout, default 240px base column width, three-lane fit, +80px growth for each additional overlap lane, and custom caller-provided column sizing rules.
- Row-height growth remains local to the dense date/calendar row instead of inflating every loaded day.
- Availability events are excluded from row-height growth and overlap calculations.
- Availability editing mode switches pointer activity from appointments to availability blocks.
- Generated appointments stay inside the primary calendar's generated availability window.
- Multi-calendar event membership and move application.
- Active edit drafts replace their source event id while create drafts do not remove loaded events.
- Deterministic demo event generation distributes events across every demo calendar.
- Pointer hit-testing, move proposal calculation, and draft creation.

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
- Vertical scrollbar dragging is bounded to one month before/after the visible date and recenters around the new visible date after scroll end.
- Scroll-end recentering preserves the intra-day pixel offset, so a user scrolled partway into a date stays partway into that same date.
- Native scrollbar-thumb completion resets the scrollbar thumb back near the center of the rebuilt virtual window.
- The `0.5-8` zoom slider and `Shift` + wheel change timeline scale without also scrolling the browser window; `Shift` + wheel keeps the nearest rendered time-grid node anchored when scroll range allows it.
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
- Calendar count changes preserve the visible day and the intra-day offset while day height changes.
- Drawing a new event area renders an opaque uncapped-width draft with visible time text without changing row height, lane layout, or committed row event count, then delegates to the external popup in the default demo and leaves the saved event visible after popup save.
- External create/edit popup flows update `activeDraft`, drawn create drafts stay at the same viewport-relative position when the popup opens and other calendars hide, create participant selection limits visible calendars to selected participants, empty participants restore the previous visible calendar set and disable save, visible same-date time edits do not scroll the calendar, date edits immediately refocus the moved draft on the first future or past change, offscreen field edits restore the draft to its last seen viewport-relative position, active draft dragging updates popup time fields, multi-calendar active drafts drag as one block, drawing a different range is blocked while a popup draft is open, popup save keeps the saved event in the draft's position, edit opens without immediately filtering calendars, edit cancel restores the original event in the draft's position, and the calendar viewport remains scrollable while the popup is open.
- Multi-calendar events focus only the hovered row instance, while dragging renders drag/drop previews in every proposed row.
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
- Infinite vertical zoom changes keep the current visible date anchored, including large zoom-out changes from late in the day and gesture zoom that keeps the nearest rendered date/time node anchored while virtual day height changes.
- Infinite vertical current-time marker renders as one horizontal line on today only when `now` is inside enabled hours.
- Infinite vertical hovered appointments expand to the full calendar column width and a minimum readable height for three-line cards.
- Infinite vertical hover can pass through an expanded card to focus another underlying overlap lane.
- Infinite vertical draft creation, event dragging, availability mode, and multi-calendar status behavior match the horizontal interaction contract.

## Manual Checks
- Horizontal scroll keeps row names and date labels fixed on the left.
- Vertical horizontal scroll keeps the time pane fixed on the left.
- Overlapping events expand on hover and come to the front.
- Rejected moves revert after drop.
