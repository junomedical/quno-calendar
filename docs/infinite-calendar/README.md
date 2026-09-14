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

The field guide keeps its interaction contracts live: newly scrolled dates populate without a simulated delay, event
cards can be resized in place, parent-reviewed mutations preserve their working row and restore the original view on
Cancel, Date Input arrow changes navigate immediately, and motion begins from an explicit draft action. An external
create draft with no participants keeps the normal calendar set and drawn date visible while its unassigned preview
and Save action remain unavailable.

TanStack Virtual notifications use its queued React update path. Layout restoration requests an ordinary React
projection before paint, keeping React 19 development free of the virtualizer `flushSync` lifecycle warning while
semantic anchor and frame-stability browser coverage continues to guard against empty intermediate views.

## Explicit display timezone

Set `settings.timeZone` to an IANA timezone to make day bucketing, geometry, Today/navigation, focus, and drawing/movement independent of the browser timezone. Inputs and mutation callbacks retain absolute timestamps. Custom renderers can format labels using `event.calendarTimeZone`. When omitted, existing browser-local behavior is retained.

Try the public-entry-point example at `/demo/calendar-timezone`: change its display timezone and drag the UTC-backed event. The example shows the unchanged source interval alongside the grid.

```tsx
<QunoInfiniteCalendar {...calendarProps} settings={{ timeZone: "Europe/Bucharest" }} />
```

DST pointer policy: event moves preserve elapsed duration. Drawn endpoints and move starts reject both nonexistent spring-forward times and ambiguous repeated autumn times. An invalid drawn endpoint cancels the gesture, so the last valid interval cannot be submitted; start a new selection at a valid time. No browser-zone or tenant-specific policy is introduced.
