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

Availability and appointments have independent deterministic collision lanes. A resource grows to the greater layer
depth, not the sum, so appointments remain overlaid on availability while overlapping availability stays readable in
both orientations. Pointer-move hit-testing and preview publication are limited to the latest position per display
frame; release still flushes the final position synchronously.

Untouched date buckets keep stable immutable snapshots, and prepared date/resource layers are reused until their
bucket, resource selection, visible time bounds, or relevant draft source changes.

## Named contracts

Use `renderEvent`, component-level `locale` and `formatters.dayLabel({ date, locale })`, plus `getDayProps`,
`getDayCellProps`, and `getHourProps` for presentation. Navigation commands and zoom notifications use named objects.

See the [breaking migration](../shared/migration.md#unreleased-named-contracts-and-product-ownership).
