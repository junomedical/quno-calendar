# Quno/Infinite Calendar

Quno/Infinite Calendar owns virtualized horizontal and vertical schedules, timestamped events, async loading, event
rendering, creation and movement, navigation, zoom, and visual focus.

`getDayProps` assigns date-wide presentation to a complete day and its visible header. `getDayCellProps`
adds resource-specific classes, inline styles, or titles from typed date, weekend, calendar, and orientation context.
`getHourProps` styles clock-hour bands and their visible labels across both orientations. Together they style
days, hours, horizontal rows, and vertical columns without taking ownership of geometry or interaction behavior.

- Public entry point: `@quno/calendar/infinite-calendar`
- Live field guide: `/guide/infinite-calendar`
- Focused demo: `/demo/infinite-calendar`
- [Architecture](./architecture.md)
- [Responsibility domains](./domains/README.md)
- [Runtime flows](./flows/README.md)
- [Decisions](./decisions.md)
- [Shared usage recipes](../shared/usage.md)

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
`scrollToDateTime({ date, time, calendarId })`. The calendar owns the virtual-row wait and viewport correction; consumers
do not query its DOM. Parent selection or draft state can be updated immediately before resource-row navigation or restoration
in the same handler. The package measures after the resulting layout commits; consumers need no `flushSync` wrapper.
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
Opening the editor restores the clicked instance's position. Horizontal draft and participant changes retain measured
day heights, and idle recentering yields to an active explicit restore. A required visible event capture returns `null`
when the event is missing or offscreen, rather than substituting its resource slot.

TanStack Virtual notifications use its queued React update path. Layout restoration requests an ordinary React
projection before paint, keeping React 19 development free of the virtualizer `flushSync` lifecycle warning while
semantic anchor and frame-stability browser coverage continues to guard against empty intermediate views.

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
39.47 KiB and 1.99 KiB gzip respectively (Node 23, gzip level 9). See [Decision 100](./decisions.md#100---reconcile-the-infinite-calendar-budget-after-branch-integration).

## Named contracts

Use `renderEvent`, component-level `locale` and `formatters.dayLabel({ date, locale })`, plus `getDayProps`,
`getDayCellProps`, and `getHourProps` for presentation. Navigation commands and zoom notifications use named objects.

See the [breaking migration](../shared/migration.md#unreleased-named-contracts-and-product-ownership).

The guide's headless typed-date navigation reads `result.start.date` from Date Parser's paired endpoint result.
See the [endpoint migration](../shared/migration.md#unreleased-paired-parser-endpoints); calendar navigation and event
timestamp contracts retain their existing shapes.
