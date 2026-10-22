# Quno/Timepicker

Quno/Timepicker selects a standalone timezone-free clock, without requiring a date.

- Public entry point: `@quno/calendar/timepicker`
- Optional stylesheet: `@quno/calendar/timepicker/styles.css`
- Live guide: `/docs/timepicker`
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
while scrolling. The initial selected hour is revealed when available. Selecting a visible minute keeps it in place; later external
selections scroll only when needed to reveal the option. Equivalent enabled-hour arrays retain the current scroll. Native buttons support Tab, Enter,
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
`--quno-time-picker-height` for the scroller, and `--quno-time-picker-time-label-width` for the hour rail. `--quno-font-family` provides the shared font. Minute numbers are 13px/400.
Sticky hour headings use 16px/700 and the normal text color to stand out from minutes.
Consumers can theme the control without calendar styles.

Datepicker's optional single-day time mode reuses the private slot renderer. Its date selection, view transitions,
labels, existing classes, and callbacks remain unchanged. Standalone Timepicker imports no date picker, input,
parser, virtualizer, date library, or timezone conversion. It has no typed-input validation flag or expected date range.

## Concept playground

The `/concept` playground uses the shared guide, autoplay loops and live phone stage from
[QUNO-032](../shared/decisions.md#quno-032---share-the-floating-guide-across-all-concept-products). Mobile presents the
explainer as a bottom drawer with chevron taps and header swipes; fullscreen sits beside the chevron in both layouts
([QUNO-038](../shared/decisions.md#quno-038--use-a-mobile-explainer-drawer-with-adjacent-fullscreen)). The drawer
overlays the full mobile canvas without reserving space or shifting the working product when collapsed
([QUNO-039](../shared/decisions.md#quno-039--overlay-the-full-mobile-canvas-with-the-explainer-drawer)).
Mobile chevron disclosure and header swipes preserve the current playback state
([QUNO-040](../shared/decisions.md#quno-040---keep-mobile-drawer-disclosure-independent-of-playback)).

Its chapters cover minute selection and preservation of a value when cadence changes. The concept keeps minutes
13 px/400 beside 16 px/700 hours and aligns both at the top. These are scoped demo styles; package styles and
selection behavior retain their contracts. See QTP-003 and [concept notes](../../demo/concept/README.md).

Works with datepicker adds a third concept chapter using Datepicker's single-day time mode and shared time choices.
It selects three date/clock pairs and returns to its starting value before looping. Standalone Timepicker remains
independent from date selection; see QTP-004.

Standalone concept chapters show cadence choices below the clock, without a second Selected time output or
business-hours checkbox. Authored scene hours remain in effect. See QTP-005.

The concept canvas follows the computer's light/dark setting while this product and the explainer retain their
existing light presentation on bright panels; see [QUNO-037](../shared/decisions.md#quno-037---follow-system-appearance-around-light-demo-panels).

The concept labels its configuration **Cadence**, with larger 5 min, 15 min and 20 min choices (at least 80×44 px).
The buttons stay below the clock and preserve an existing time while the slot cadence changes. These styles apply
only to the concept controls; see QTP-007.

The main concept homepage uses shareable product/demo links. The current field guide connects those chapters to
its integration examples and recipes; the previous guide is preserved under `/docs/archive/timepicker`.
See [QUNO-041](../shared/decisions.md#quno-041---promote-the-concept-homepage-and-preserve-field-guides).

Concept chapters now use `/timepicker/{chapter}` directory paths; current navigation omits archive links.
See [QUNO-042](../shared/decisions.md#quno-042---use-directory-routes-and-quiet-documentation-loading).
