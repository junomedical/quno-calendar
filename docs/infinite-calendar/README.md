# Quno/Infinite Calendar

Quno/Infinite Calendar owns virtualized horizontal and vertical schedules, timestamped events, async loading, event
rendering, creation and movement, navigation, zoom, and visual focus.

`getCalendarDayProps` assigns date-wide presentation to a complete day and its visible header. `getCalendarCellProps`
adds resource-specific classes, inline styles, or titles from typed date, weekend, calendar, and orientation context.
`getCalendarHourProps` styles clock-hour bands and their visible labels across both orientations. Together they style
days, hours, horizontal rows, and vertical columns without taking ownership of geometry or interaction behavior.

- Public entry point: `@quno/calendar/infinite-calendar`
- Live field guide: `/guide/infinite-calendar`
- Focused demo: `/demo/infinite-calendar`
- [Architecture](./architecture.md)
- [Responsibility domains](./domains/README.md)
- [Runtime flows](./flows/README.md)
- [Decisions](./decisions.md)
- [Shared usage recipes](../shared/usage.md)

Day keys use shared timezone-free `IsoDate` values. Event `start` and `end` remain timestamp strings and retain their
local or offset semantics.

`CalendarEvent.kind` identifies an appointment, availability, or blocker. Availability is a foreground event by
default, so it can be selected and contributes to overlap sizing. Set `renderLayer: "availability"` only when a
consumer needs the original full-cell background treatment; that presentation layer stays out of overlap metrics.

The horizontal navigation handle can reveal a resource row with
`scrollToDateTime(date, time, { calendarId })`. The calendar owns the virtual-row wait and viewport correction; consumers
do not query its DOM.

The field guide keeps its interaction contracts live: newly scrolled dates populate without a simulated delay, event
cards can be resized in place, parent-reviewed mutations preserve their working row and restore the original view on
Cancel, Date Input arrow changes navigate immediately, and motion begins from an explicit draft action. An external
create draft with no participants keeps the normal calendar set and drawn date visible while its unassigned preview
and Save action remain unavailable.

TanStack Virtual notifications use its queued React update path. Layout restoration requests an ordinary React
projection before paint, keeping React 19 development free of the virtualizer `flushSync` lifecycle warning while
semantic anchor and frame-stability browser coverage continues to guard against empty intermediate views.
