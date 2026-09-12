# Quno/Datepicker

Quno/Datepicker owns direct manipulation of a timezone-free day or inclusive range, including painting, endpoint
editing, range movement, month navigation, motion, localization, theming, and day presentation hooks.

- Public entry point: `@quno/calendar/datepicker`
- Live field guide: `/guide/datepicker`
- Focused demo: `/demo/datepicker`
- [Decisions](./decisions.md)
- [Shared usage recipes](../shared/usage.md)
- [Shared date model and package boundaries](../shared/architecture.md)

The visible month remains independent from the selected value. Controlled and uncontrolled usage share `DateRange`,
with equal endpoints representing a single day. The field guide demonstrates `selectionMode="single"` on Datepicker by
itself before separately composing a range-enabled picker with a focused Quno/Date Input selection surface.

The guide presents range selection as direct manipulation instead of a forced from-to sequence. Its in-place month
navigator follows seasonal groups—March–May, June–August, September–November, and December continuing into
January–February—while sticky year labels preserve context during fast scrolling.

Captured touch and pen painting performs at most one hit-test per display frame and always processes the release cell
before commit. Quick-jump scroll bursts likewise publish one virtual year window per frame while retaining the 120ms
settled-edge extension and semantic prepend correction. Stable formatter, weekday, month-grid, and day descriptors are
memoized across pointer previews.

`isDayDisabled` prevents a date from becoming a standalone selection or a range start or end. Disabled dates may remain
inside an otherwise valid inclusive range. Async availability stays in consumer state: unresolved and failed checks
should return `true` from `isDayDisabled`, while `getDayCellProps` independently presents loading, error, holiday, or
other product states. The field guide demonstrates this fail-closed delayed-loading pattern.

`limitDateFrom` and `limitDateTo` add inclusive hard bounds around that resolver. Earlier or later dates are disabled
before `isDayDisabled` runs, so consumers can omit them from availability requests. Boundary dates remain selectable
when the resolver permits them. Existing controlled values are displayed rather than rewritten if limits later change.

## Named contracts

Datepicker owns its interaction algorithms. Shared runtime date helpers are imported from the headless root.
Use `limitDateFrom`, `limitDateTo`, `isDayDisabled({ date })`, `getDayCellProps(context)`, object-context `formatters`,
and `onChange({ value })`.

See the [breaking migration](../shared/migration.md#unreleased-named-contracts-and-product-ownership).
