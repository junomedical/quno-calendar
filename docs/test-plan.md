# Test Plan

## Unit Tests
- Date virtualization with excluded weekdays.
- Time-to-pixel conversion, zoom, and snap interval.
- Event overlap lane layout, row-height growth above three lanes, and continued mini-lane shrinking for dense groups.
- Row-height growth remains local to the dense date/calendar row instead of inflating every loaded day.
- Availability events are excluded from row-height growth and overlap calculations.
- Availability editing mode switches pointer activity from appointments to availability blocks.
- Generated appointments stay inside the primary calendar's generated availability window.
- Multi-calendar event membership and move application.
- Deterministic demo event generation distributes events across every demo calendar.
- Pointer hit-testing, move proposal calculation, and draft creation.

## React Tests
- Calendar root renders the infinite view.
- Fixed labels, the visible single sticky top time scale, same-row CSS-sticky date labels, current-time line alignment, controlled zoom callback, and custom event renderer contract are present.
- Date labels share the same sticky header row as the time scale, and active availability blocks do not cover calendar row labels.
- Event renderer receives status information.

## Playwright Tests
- Initial demo render.
- Demo sidebar rendering stats populate frame redraw time and visible event DOM-node count.
- Vertical virtual scrolling changes visible dates.
- Vertical scrollbar dragging is bounded to one month before/after the visible date and recenters around the new visible date after scroll end.
- Scroll-end recentering preserves the intra-day pixel offset, so a user scrolled partway into a date stays partway into that same date.
- Native scrollbar-thumb completion resets the scrollbar thumb back near the center of the rebuilt virtual window.
- The `0.5-8` zoom slider and `Shift` + wheel change timeline scale without also scrolling the calendar.
- Zoom values above `6` switch the timeline row grid and time labels from 15-minute to 5-minute cadence.
- Dense zoom levels progressively hide minor time labels so 15/45 disappear first and minute labels disappear entirely before labels overlap.
- Dataset scale can switch to 20,000 events per year.
- Large dataset scales keep events visible and hoverable instead of clustering into a few calendars.
- At 20,000 events/year, hovering visible events keeps them visible and rendered row heights vary locally according to overlap density.
- Bottom-lane overlapped cards expand to a readable height on hover.
- Visible day boxes do not overlap adjacent date rows when variable row heights are measured.
- Availability renders as a background layer while draft/new event drawing can occur on top.
- Availability editing mode makes appointments inactive background blocks, supports drawing new availability, and supports dragging an existing availability block.
- Event cards include a visible `H:mm–H:mm` time range line.
- Compact event cards hide the time line when three lines do not fit and reveal it once the card has enough hover-expanded height.
- Date navigation can jump to a specific date and back to today.
- Calendar count changes preserve the visible day while day height changes.
- Drawing a new event area renders an uncapped-width draft, commits creation, and leaves the created event visible after mouse-up.
- Multi-calendar events focus only the hovered row instance, while dragging renders drag/drop previews in every proposed row.
- Event resize/focus changes are not animated.
- Event cards show a thick left accent border while row labels remain uncolored.
- Dragging an event produces parent-side accept/reject feedback.

## Manual Checks
- Horizontal scroll keeps row names and date labels fixed on the left.
- Overlapping events expand on hover and come to the front.
- Rejected moves revert after drop.
