# Architecture and API Notes

## Component Shape
`CalendarRoot` is the public shell. It accepts shared settings, calendars, data loading, event rendering, and interaction callbacks. The current `view` is `infinite`, which delegates to `InfiniteTimelineView`.

`InfiniteTimelineView` owns scroll state, zoom geometry, virtual day rendering, hit-testing, drag previews, and new-event draft state. It does not persist event changes. Parent code owns accepted data updates.

The infinite view also exposes an imperative navigation handle with `scrollToDate(dateKey)` and `scrollToToday()`. This keeps date navigation reusable while preserving internal virtualization details.

The active editing layer is selected with `interactionMode`. In `events` mode, appointments are active and availability is a pointer-transparent background. In `availability` mode, availability blocks are active and draggable/creatable while appointments become pointer-transparent background context.

## Core API
```tsx
<CalendarRoot
  calendars={calendars}
  selectedCalendarIds={selectedCalendarIds}
  loadEvents={loadEvents}
  eventRenderer={EventCard}
  onEventMoveRequest={handleMove}
  onEventCreateRequest={handleCreate}
  interactionMode="events"
  settings={{
    startHour: 8,
    endHour: 18,
    zoom: 1.2,
    snapMinutes: 15,
    excludedWeekdays: [0, 6]
  }}
/>
```

## Data Flow
- The infinite view computes visible date keys from the virtual scroll position.
- Vertical virtualization is bounded around the current visible anchor date. The rendered scroll range starts one month before the anchor and ends one month after it. When vertical scrolling settles, including native scrollbar-thumb drag completion through `scrollend`, the view promotes the current top visible date to the new anchor, rebuilds the month-before/month-after range, and scrolls that date back to the center area of the scrollbar while preserving the pixel offset inside that date. This keeps scrollbar dragging bounded to nearby dates while preserving the infinite-scroll illusion through recentering without a visible content jump.
- Missing visible dates are requested with `loadEvents({ startDate, endDate, calendarIds })`.
- Events are grouped by date and every matching calendar row, then converted to pixel layout. Events can use `calendarId` for single-row ownership or `calendarIds` for multi-calendar membership such as doctor plus room.
- Availability events use `kind: "availability"`. They render as a row-height background layer through the same external `eventRenderer`, but they are excluded from overlap lane calculation and row-height growth. Availability shells are pointer-transparent so draft creation and regular events can render on top.
- In availability editing mode, the layer behavior flips: availability shells become pointer-active, regular event shells become inactive background blocks, and drawn drafts are created as `kind: "availability"`.
- Overlapping events are laid out with sorted interval partitioning. A connected overlap chain shares one mini-height lane count, and each event uses the first lane whose previous event has ended. When overlap depth exceeds three lanes, only that date/calendar row grows so dense groups get more vertical space. If the group is still dense, mini-lanes continue shrinking below normal card height rather than overflowing the row.
- Variable day heights use a cheap base estimate in the virtualizer and measured rendered day elements for actual size. This avoids scanning the full virtual date range while still letting individual dense days become taller.
- Drag/drop and draft drawing use hit-testing against the rendered virtual day item and row-local heights to convert pointer coordinates into date, calendar, and snapped minute.
- Creation and move interactions only start from timeline grid space. Left-side date and calendar labels are not hit targets for creating or moving events.
- The top visible date is tracked and restored when the selected calendar count changes, because changing row count changes virtual day heights.
- The time scale is a single CSS-sticky top row and owns the top sticky layer. Individual day sections render the CSS-sticky date label in the left side of that same header row, so date and time share one sticky band. Date labels are sticky on both top and left axes so horizontal timeline scroll cannot move them out of view.
- Time labels adapt to horizontal density. At normal zoom, hour, 15, 30, and 45 labels render. As the time scale gets denser, 15 and 45 labels are removed first, then all minute labels are removed so only hour labels remain and numbers do not overlap. Above zoom `6`, the expanded time scale switches to 5-minute labels such as `9 5 10 15 ... 55`.
- Timeline grid cadence is 15 minutes by default and switches to 5-minute columns once zoom is greater than `6`, so the expanded high-zoom view exposes finer visual timing.
- Current-time markers render on every visible day; today is fully opaque and other days are shown at 50% opacity. The demo passes live system time into the calendar. The round pin appears once in the sticky time scale, with a header segment that connects the line to the pin. The pin and day lines use the same natural timeline x-position and a high marker layer so the red line scrolls with the grid while rendering above events.
- `Shift` + wheel on the calendar viewport requests a zoom change through `onZoomChange`. The parent remains the source of truth for the actual zoom value, and the view cancels the native wheel scroll so zooming does not also scroll the calendar. The demo exposes zoom as a `0.5-8` slider and the infinite view clamps incoming zoom settings to the same range.
- Move requests are previewed locally, then committed only through `onEventMoveRequest`. The request includes the row instance where the drag started and the full proposed calendar membership.
- During drag, every visible instance of the original event remains in normal row layout with status `dragging`, while matching `drop-preview` overlays are rendered in every proposed calendar row. This prevents overlap lanes and neighboring cards from resizing before drop while still showing the full multi-calendar move.
- Hover expansion is disabled while a drag is active so cards under the pointer do not resize or open beneath the preview.
- Create requests are rendered as status `new`, then committed through `onEventCreateRequest`. After the callback resolves, the view inserts the created event into the loaded visible date cache immediately; if the parent does not return a created event object, the view uses a local copy of the draft.

## Demo Instrumentation
The demo app reports lightweight rendering stats in the left pane. A throttled `requestAnimationFrame` sampler shows the average redraw frame interval in milliseconds. The same sampler counts currently visible event DOM nodes by querying rendered appointment, availability, and draft shells that intersect the calendar viewport. The sampler runs in its own sidebar component so stats updates do not re-render the calendar tree. This is intentionally demo-only instrumentation and is not part of the reusable calendar API.

## Event Renderer Contract
The renderer receives an event, a render status, lane information, overlap information, and a style object. It receives no date virtualization or calendar layout internals. If the same event appears in multiple calendar rows, hover status is local to the row instance under the pointer, while drag/drop-preview status is shared across visible instances by event id.

Each renderer is mounted inside a positioned event shell that is also a CSS size container named `calendar-event`. Product renderers can use container queries to decide how their own content responds to short or narrow event allocations.

The demo renderer shows title, subtitle/patient, and a time range line in `H:mm–H:mm` format. Short-height container queries hide the time line first when three lines do not fit, then hide patient text and reduce title size at smaller heights.

The shell also exposes `--event-accent` from `event.color`. The demo uses that value for a thick card-left accent border while calendar row labels remain uncolored.

Hover width expansion is CSS-driven by the event shell and applies only to the hovered row instance. The shell exposes `--event-width` and `--event-hover-width`; the hovered shell uses `width: max-content`, `min-width: var(--event-width)`, and a capped max width so cards whose content already fits stay at their base width. Events narrower than 250px can expand up to 250px or the remaining row space; events already wider than 250px receive a wider cap so hover does not shrink them. New-event drafts are not width-capped.

Event shells are memoized around event identity, status, and geometry. Drag-end state changes remove the preview and update the moved event without invoking every unchanged external event renderer.

Supported statuses:
- `existing`
- `hovered`
- `dragging`
- `drop-preview`
- `new`
