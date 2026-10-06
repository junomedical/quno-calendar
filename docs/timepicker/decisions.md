# Quno/Timepicker decisions

## QTP-001 - Select a standalone timezone-free clock

- Date: 2026-10-06
- Status: Accepted
- Context: Choosing a clock should also be available without mounting a date calendar or supplying a date.
- Decision: Export `QunoTimePicker` from the independent `@quno/calendar/timepicker` subpath with an optional scoped
  stylesheet. Use controlled `value` or uncontrolled `defaultValue`, a separate `HH:mm` string or null, and named
  `onChange({ value })`. Reuse the enabled-hour and minute-cadence semantics of Datepicker's time mode, sticky hour
  headings, no more than six minute buttons per row, selected-slot reveal, and native button activation. Clear emits
  null; disabled prevents selection and Clear. Configuration changes and controlled off-slot clocks are never rounded.
- Consequences: No date, parser, timezone, or virtualizer enters this feature. Labels, a clock formatter, class names,
  stable slots/state attributes, and `--quno-time-picker-*` tokens keep presentation consumer-owned. Shared renderer
  ownership and dependency direction are recorded in QUNO-017; Datepicker retains its date-time interaction contract.

## Shared cadence update — 2026-10-06

[QUNO-018](../shared/decisions.md#quno-018---size-time-rows-by-minute-cadence) extends shared cadence choices with
20-minute steps and chooses time-selector columns by cadence. It supersedes the previous fixed maximum-six-column
layout; existing value, focus, formatting, and typed-clock ownership contracts remain in force.

## Shared enabled-hour default update — 2026-10-06

[QUNO-019](../shared/decisions.md#quno-019---default-omitted-or-empty-enabled-hours-to-all-hours) supersedes the empty-list
restriction: omitted or empty enabled hours now allows all 24 hours, including forced typed-clock validation and spins.
Nonempty lists retain their restrictions; disabled state, cadence, and existing values keep their contracts.

## Shared five-minute row update — 2026-10-06

[QUNO-020](../shared/decisions.md#quno-020---use-six-columns-for-five-minute-cadence) supersedes the five-minute column
count in QUNO-018: both time selectors now use two rows of six minute choices per hour.

## Shared hour emphasis update — 2026-10-06

[QUNO-021](../shared/decisions.md#quno-021---emphasize-hours-above-minute-options) makes sticky hour headings
larger and bold (16px/700), using normal text color beside 13px/550 minutes. Existing geometry and interaction remain.
