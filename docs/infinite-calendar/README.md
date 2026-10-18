# Quno/Infinite Calendar

Quno/Infinite Calendar owns virtualized horizontal and vertical schedules, timestamped events, async loading, event
rendering, creation and movement, navigation, zoom, and visual focus.

`getDayProps` assigns date-wide presentation to a complete day and its visible header. `getDayCellProps`
adds resource-specific classes, inline styles, or titles from typed date, weekend, calendar, and orientation context.
`getHourProps` styles clock-hour bands and their visible labels across both orientations. Together they style
days, hours, horizontal rows, and vertical columns without taking ownership of geometry or interaction behavior.

Alternating grid surfaces follow the resource's position in the complete displayed list in both orientations.
Horizontal row virtualization never restarts that pattern. Try `/demo/infinite-calendar` with six calendars and
navigate to October 30, 2026: scroll toward October 31 and back. Room 201 stays on the same surface even when earlier
rows unmount. Customize the alternate color with `--quno-calendar-alternate-surface`.

- Public entry point: `@quno/calendar/infinite-calendar`
- Live field guide: `/guide/infinite-calendar`
- Focused demo: `/demo/infinite-calendar`
- [Architecture](./architecture.md)
- [Responsibility domains](./domains/README.md)
- [Runtime flows](./flows/README.md)
- [Decisions](./decisions.md)
- [Shared usage recipes](../shared/usage.md)

Event requests use dates intersecting the committed viewport after a 100 ms settling delay. Rendering overscan and
offscreen restore pins do not widen that window. Prefetch remains configurable; return zero before/after days for
viewport-only reads. Optional `loadCalendarIds` separates API read coverage from `selectedCalendarIds`, so hiding rows,
including every row, can reuse an all-calendar read. Without it, read coverage follows the displayed selection.
An adjacent in-flight edge date may finish through a layout correction; genuinely distant requests are cancelled.
The focused demo passes its base calendar selection as read coverage while draft participants control displayed rows.

Showcase HTTP requests send `{ startDate, endDate, calendarIds, eventsPerYear }` to `/api/demo-events`.
The server generates deterministic fixtures for the requested years and returns only matching date/resource records.
It never receives event arrays. Appointments fit the common working hours of both participants. Fixture timestamps
express local wall-clock times, so an 08:00 doctor shift remains 08:00 in every browser timezone. Doctor shifts remain
intentionally varied: Dmitry 08:00–14:00, Bhuvin 10:00–17:00 and Marco 12:00–18:00 on weekdays.
Session creates, edits and moves overlay later responses locally; changing dataset resets those changes.
Try opening browser Network tools, navigating to another month and inspecting the POST body. Edit an appointment,
then change API delay to refetch: the saved edit remains. See
[Decision 111](./decisions.md#111---query-demo-event-ranges-on-the-server).

Dragging an event back to its starting slot neither opens its editor nor requests a move. The calendar owns
this distinction from an ordinary click, which still invokes `onEventActivate`. Pointer jitter within four pixels
also activates, even if it crosses a snap boundary; consumers need no movement guard.

`CalendarEventBase` exposes the shared `id`, `calendarId`, and `start` fields. `CalendarEvent` extends it with the
remaining renderer data, so consumers can store an event's identity and start position without a local field selection.

Day keys use shared timezone-free `IsoDate` values. Event `start` and `end` remain timestamp strings and retain their
local or offset semantics.

`CalendarEvent.kind` identifies an appointment, availability, or blocker. Availability is a foreground event by
default, so it can be selected and contributes to overlap sizing. Set `renderLayer: "availability"` only when a
consumer needs the background treatment; that layer has independent overlap lanes and may grow the resource.

The horizontal navigation handle can reveal a resource row with
`scrollToDateTime({ date, time, calendarId })`. The calendar owns resource projection and viewport correction; consumers
do not query its DOM. Parent selection or draft state can be updated immediately before resource-row navigation or restoration
in the same handler. The package resolves geometry after the resulting layout commits; consumers need no `flushSync` wrapper.
Pass `align: "center"` to center the requested row even when it is already visible. `getVisibleDateKeys()` returns
only dates intersecting the usable viewport, so an external creation form can start on the middle visible date.
Explicit centering follows the resource's actual collision height as asynchronous events arrive. A newer date request,
restoration, or cancellation supersedes queued row navigation.

Optional `isLoading` and `loadingFallback` props let a consumer supply its initial skeleton. While loading, the
timeline waits to mount until a selected ID matches a supplied calendar. IDs that arrive before calendar metadata or
match no resource keep the fallback visible without header-only geometry. Once a matching row exists, the timeline
measures and loads events beneath the hidden surface. Clearing `isLoading` reveals that same timeline. Consumers own
readiness, failures and any initial centered navigation. The loading shell retains explicit, percentage, and minimum
component dimensions before metadata exists and the mounted timeline fills that same space.

The field guide keeps its interaction contracts live: newly scrolled dates populate without a simulated delay, event
cards can be resized in place, parent-reviewed mutations preserve their working row and restore the original view on
Cancel, Date Input arrow changes navigate immediately, and motion begins from an explicit draft action. An external
create draft with no participants keeps the normal calendar set and drawn date visible while its unassigned preview
and Save action remain unavailable. Multi-participant edits retain one surviving visible event instance while participants
are toggled; removing that participant transfers the anchor to another surviving instance. Captured event anchors
record the resolved participant id. Cancel retains the original participant's independent edit anchor.
Opening the demo editor preserves the clicked resource row in horizontal view and the event instance in vertical view.
Horizontal draft and participant changes retain semantic
day positions, and idle recentering yields to an active explicit restore. A required visible event capture returns `null`
when the event is missing or offscreen, rather than substituting its resource slot.

The focused demo captures the clicked participant's resource/time slot when opening or cancelling a horizontal editor.
This keeps the row and top visible day stationary as a compact overlap card becomes a full-row draft or hover card.
Vertical editor transitions continue to anchor the event instance; participant edits keep their surviving-instance policy.
Try `/demo/infinite-calendar`: select one calendar, open an overlapping appointment, close its editor, and hover again.
The grid should remain in place. Active horizontal restores keep their target date mounted through resource resizing,
including Cancel after removing the original participant. Try adding Marco, Room 202 and Surgery A, then removing Marco
and Dmitry before Cancel; repeat with one or six calendars. October 8 and Dmitry return to their original position.
See [Decision 104](./decisions.md#104---anchor-horizontal-demo-editor-transitions-to-resource-slots) and
[Decision 105](./decisions.md#105---retain-horizontal-restore-dates-through-resource-changes).

Saving uses the visible editor anchor when available, otherwise its retained last-seen anchor. Horizontal saves restore
the participant's resource/time slot so collision lanes and hover expansion cannot shift the row. An offscreen save
keeps the bounded restore active through date navigation and returning rows; manual scrolling still cancels it.
Try drawing on October 20 for Marco Eggens, scrolling to December, then saving. October 20 and Marco's row return to
the retained position. See [Decision 109](./decisions.md#109---restore-offscreen-saves-to-the-retained-editor-anchor).

Drawing and Cancel batch the controlled draft change and restoration request in the same handler. After projecting
horizontal dates, the view reapplies the anchor and publishes the date range and resource viewport together before
paint. The restore date stays pinned through create closure as well as edit closure; fade-out remains independent.
Try six calendars, draw on October 17 in Room 203, then Cancel. The row stays at its original screen position throughout,
with no blank calendar frame. See [Decision 110](./decisions.md#110---coordinate-editor-restoration-and-virtual-projection-before-paint).

A shared mathematical engine now owns both orientations: logical coordinates, event preparation, virtual windows,
anchor priority and committed viewport revisions. One browser adapter writes scroll offsets. Resource/time and
participant anchors survive asynchronous layout changes without DOM measurement retries or forced React commits.
See [Decision 116-runtime](./decisions.md#116-runtime---one-mathematical-runtime-for-both-orientations) and the
[rewrite verification record](./runtime-rewrite.md). Scrolling within an unchanged rendered window updates the
engine without rerendering React; zoom reuses prepared collision data and stable resource extents. See
[Decision 117](./decisions.md#117---separate-stable-layout-from-viewport-presentation).

Foreground events and explicitly background-layered availability have independent deterministic collision lanes. A resource grows to the greater layer
depth, not the sum, so foreground events remain overlaid on background availability while overlapping background availability stays readable in
both orientations. Pointer-move hit-testing and preview publication are limited to the latest position per display
frame; release still flushes the final position synchronously.

Untouched date buckets keep stable immutable snapshots, and prepared date/resource layers are reused until their
bucket, resource selection, visible time bounds, or relevant draft source changes.

`projectEvents` optionally transforms cached events for the inclusive rendered date window. It is synchronous and
must leave its input records unchanged. Changing the callback updates event geometry in either orientation without
invalidating API loading. Clearing it restores the persisted snapshot. Empty rendered dates also accept previews.
Accepted moves patch time and participant geometry on the cached saved record, preserving saved metadata.
Projection-only events require an explicit commit or loader response to enter the saved cache.
Products own recurrence expansion; saves and filters still refresh through `eventVersion` or `loadEvents`.

## Bundle budget

JavaScript is limited to 50 KiB gzip and the optional stylesheet to 2 KiB gzip. The current artifacts measure
32.27 KiB and 1.97 KiB gzip respectively (Node 23.10.0, gzip level 9). See [Decision 100](./decisions.md#100---reconcile-the-infinite-calendar-budget-after-branch-integration).

## Zoom continuity

Shift-wheel changes zoom by 0.30 per nonzero input sample in either orientation, twice the previous sensitivity.
See [Decision 120](./decisions.md#120---increase-shift-wheel-zoom-sensitivity).

With `onZoomChange`, Shift-wheel and trackpad input cannot fall through into native scrolling, even at zoom limits.
The viewport also suspends native momentum scrolling during the gesture, while programmatic zoom anchoring remains
available. This prevents Chrome from showing blank grid/card patches during inertial touchpad zoom
([Decision 119](./decisions.md#119---suspend-native-momentum-scrolling-during-zoom)).
Shift-touch movement suppresses panning. Ordinary scrolling resumes after the 300 ms momentum tail following Shift
input. See [Decision 118](./decisions.md#118---capture-shift-input-even-when-zoom-cannot-change).

Wheel input accumulates while the parent accepts the previous request. The next request waits for DOM and scroll
commit, then the next animation callback; delayed parents receive fewer callbacks without losing the accumulated
zoom distance. Unacknowledged input expires after one second without retry. This is not a GPU-presentation signal.
The physical-touchpad experiment still showed gaps without the native-scroll lock, so it remains enabled.
See [Decision 121](./decisions.md#121---pace-wheel-requests-after-dom-and-scroll-commit).

Both Shift-wheel orientations restore their first pointer-nearest time node in the controlled zoom layout commit before paint,
using actual effective geometry. External zoom immediately takes over anchoring; delayed parents retain the old view
until they commit. Vertical dates and both virtual windows project to their final geometry before paint, including
large zoom-outs. Horizontal slider changes prefer a visible current-time marker; vertical slider changes retain the
top date/time. See [Decision 113](./decisions.md#113---commit-vertical-zoom-geometry-and-focus-before-paint).

Time labels appear or disappear immediately at their readable zoom thresholds, at full opacity. The grid switches
directly between quarter-hour and five-minute cadence above zoom 6. Hidden ticks retain their nodes with `display: none`;
there are no detail overlays, opacity ramps or fade animations.
Try the guide's **Reveal time progressively** controls in both directions.
See [Decision 116](./decisions.md#116---remove-zoom-detail-transparency).

## Named contracts

Use `renderEvent`, component-level `locale` and `formatters.dayLabel({ date, locale })`, plus `getDayProps`,
`getDayCellProps`, and `getHourProps` for presentation. Navigation commands and zoom notifications use named objects.

See the [breaking migration](../shared/migration.md#unreleased-named-contracts-and-product-ownership).

The guide's headless typed-date navigation reads `result.start.date` from Date Parser's paired endpoint result.
See the [endpoint migration](../shared/migration.md#unreleased-paired-parser-endpoints); calendar navigation and event
timestamp contracts retain their existing shapes.

## Row visibility changes

Horizontal row filters keep the current date and a surviving resource’s local position. When the row count changes,
the calendar rebuilds cached base estimates and reapplies known dense-day measurements. It repeats the anchor correction
after the new scroll spacer commits. Consumers can retain their last compact selection while new dates load.

Late responses for other dates also preserve the displayed date and row. Large overlap updates can exceed the old
scroll area. Keep the original anchor through the new spacer commit, then publish and render the corrected virtual
range before paint. New events never become navigation targets. A user's newer navigation takes priority.

Parent editors can restore a date-only target after Cancel or Save. Use the opening date for cancellation and the date
displayed at the Save click for success. A bounded restore keeps that date through deferred draft measurements and
returning rows. Date-only restores leave horizontal scrolling unchanged and yield to manual navigation. Availability,
blocker and appointment outcome policy remains in the consumer.
