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

Start and End shortcuts reveal the endpoint month without editing selection. Activation focuses the stable month
heading before the shortcut exits, preserving focus inside a composed input popup for pointer and keyboard use.

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

## Optional single-day time selection

Set `selectionMode="single"` and `timeMode` to open in-place time navigation immediately after selecting an enabled day, including reselecting the same day. Mouse, touch, pen, and native keyboard activation share this flow. Choosing a minute returns to days and focuses the stable title button. The selected clock appears beside the date in the existing selection summary above the calendar; there is no time control below it. Initial or externally controlled dates remain in the current view until a day is selected in the picker. Escape also
returns without committing. While time navigation is open, the title displays the selected full date, such as `19 October 2026`, using the locale. The left/right header arrows select the previous/next enabled day without leaving time navigation, retain the clock, and reveal the selected day’s month when returning to days. They skip `isDayDisabled` dates, respect inclusive limits, and disable exhausted directions. Clicking the full-date title returns to day selection in that date’s month without changing the day or clock. Returning to days restores the visible month title; clicking that month title opens month/year navigation. Month/year navigation and time navigation are mutually exclusive.

Use `time`/`defaultTime` for a separate timezone-free `HH:mm` value. `onChange({ value, time })` includes that clock
only in time mode; choosing another day preserves it and Clear removes both. `enabledHours` is an array of zero-based
hours (omitted or empty enables all 24); invalid or duplicate hours do not create options. `minuteCadence`
defaults to 15 and accepts 1, 2, 3, 4, 5, 6, 10, 15, 20, or 30. Minutes begin at 00, stay below 60, and wrap after at most
six buttons per row, following the [cadence row sizes](../timepicker/README.md#value-and-settings). Five-minute cadence uses two rows of six choices per hour. Hour labels remain sticky in a narrow left rail, like years in month navigation.

Time selection requires an enabled selected date. Range mode ignores time mode. Controlled clocks remain visible
when settings change without rounding or rewriting them. Consumers own revalidation of persisted values.

Optional labels are `timeNavigation`, `noEnabledHours`, `previousDay`, and `nextDay`; `formatters.time({ time, locale })` changes
clock presentation; `formatters.timeDate({ date, locale })` overrides the time-view date title. Class-name keys `timeNavigation`, `hourGroup`, `hourHeading`, and `minuteOption`
map to `time-navigation`, `hour-group`, `hour-heading`, and `minute-option` data slots. The calendar
exposes `data-view="time"`; minute options expose `aria-pressed` and `data-time`.
The rail width uses `--quno-date-picker-time-label-width`; other colors and radii use existing scoped tokens.

See the [copyable composition](../shared/usage.md#single-day-date-and-time), both public guides, and `/demo/date-time`.
The composed input also accepts an omitted year, such as `6 oct 2pm`, using Date Parser’s single-date ranking.

Sticky hour headings use 16px and weight 700 with the normal text color to stand out from minutes.
Minute options use the calendar day numbers’ 13px font size and 550 weight, independent of surrounding inherited
button typography. Picker cadence/hour settings constrain offered choices; a composed Date Input accepts arbitrary
valid typed clocks by default and can enforce those settings with its own `forceCadence` prop.

For clock selection without a date calendar, use the separate [Quno/Timepicker](../timepicker/README.md). Both features share the internal slot renderer while keeping independent public props and styles.
