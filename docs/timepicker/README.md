# Quno/Timepicker

Quno/Timepicker selects a standalone timezone-free clock, without requiring a date.

- Public entry point: `@quno/calendar/timepicker`
- Optional stylesheet: `@quno/calendar/timepicker/styles.css`
- Live guide: `/guide/timepicker`
- Focused demo: `/demo/timepicker`
- [Decisions](./decisions.md)
- [Copyable recipe](../shared/usage.md#qunotimepicker)

## Value and settings

Use `value: string | null` with `onChange({ value })` for controlled state, or `defaultValue` for local state. Clocks
use `HH:mm`. Clear emits `null`. Omitted `value` is uncontrolled; explicit `null` is a controlled empty selection.
Changing settings or supplying a clock outside the offered slots preserves its value and summary without rounding.

`enabledHours` accepts zero-based hours. Omitted or empty enables 00–23. Duplicate, fractional, and
out-of-range entries create no extra options. `minuteCadence` defaults to 15 and accepts 1, 2, 3, 4, 5, 6, 10, 15, 20,
or 30. Minutes start at 00, remain below 60, and wrap after at most six buttons per row. Hour headings remain sticky
while scrolling. The selected hour and minute scroll into view when available. Native buttons support Tab, Enter,
and Space, keep focus after selection, and expose `aria-pressed`. `disabled` disables both selection and Clear.

Columns depend on cadence so every hour ends with a full row:

| Cadence (minutes) | Items per row |
| ----------------- | ------------- |
| 1                 | 5             |
| 2                 | 5             |
| 3                 | 5             |
| 4                 | 5             |
| 5                 | 6             |
| 6                 | 5             |
| 10                | 6             |
| 15                | 4             |
| 20                | 3             |
| 30                | 2             |

## Presentation and composition

Use `labels` (`timeNavigation`, `noEnabledHours`, `empty`, `clear`), `formatters.time({ time, locale })`, and
`classNames` (`root`, `selectionSummary`, `clearButton`, `timeNavigation`, `hourGroup`, `hourHeading`, `minuteOption`).
Stable `data-slot` attributes match the kebab-case names; minute buttons expose `data-time`, and hour groups expose
`data-hour`. The root accepts native div attributes and exposes `aria-disabled` and `data-disabled` when disabled.
Locale is passed to the clock formatter; default clock presentation is `HH:mm`.

The independent stylesheet uses `quno-time-picker-*` classes and `--quno-time-picker-*` tokens for colors, border,
radius, height, and hour-rail width. Use `--quno-time-picker-minute-radius` for minute buttons,
`--quno-time-picker-height` for the scroller, and `--quno-time-picker-time-label-width` for the hour rail. `--quno-font-family` provides the shared font. Minute numbers are 13px/550,
aligned with Datepicker. Sticky hour headings use 16px/700 and the normal text color to stand out from minutes.
Consumers can theme the control without calendar styles.

Datepicker's optional single-day time mode reuses the private slot renderer. Its date selection, view transitions,
labels, existing classes, and callbacks remain unchanged. Standalone Timepicker imports no date picker, input,
parser, virtualizer, date library, or timezone conversion. It has no typed-input validation flag or expected date range.
