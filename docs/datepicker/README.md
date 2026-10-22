# Quno/Datepicker

Quno/Datepicker owns direct manipulation of a timezone-free day or inclusive range, including painting, endpoint
editing, range movement, month navigation, motion, localization, theming, and day presentation hooks.

- Public entry point: `@quno/calendar/datepicker`
- Live field guide: `/docs/datepicker`
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
Headless parser results pair `{ date, time }` in `start` and `end`; direct parser compositions project endpoint dates
into the picker's existing `DateRange`. See the [endpoint migration](../shared/migration.md#unreleased-paired-parser-endpoints).

Sticky hour headings use 16px and weight 700 with the normal text color to stand out from minutes.
Minute options use the calendar day numbers’ 13px font size and 550 weight, independent of surrounding inherited
button typography. Picker cadence/hour settings constrain offered choices; a composed Date Input accepts arbitrary
valid typed clocks by default and can enforce those settings with its own `forceCadence` prop.

For clock selection without a date calendar, use the separate [Quno/Timepicker](../timepicker/README.md). Both features share the internal slot renderer while keeping independent public props and styles.

## Concept playground

The `/concept` playground uses the shared guide, autoplay loops and live phone stage from
[QUNO-032](../shared/decisions.md#quno-032---share-the-floating-guide-across-all-concept-products). Mobile presents the
explainer as a bottom drawer with chevron taps and header swipes; fullscreen sits beside the chevron in both layouts
([QUNO-038](../shared/decisions.md#quno-038--use-a-mobile-explainer-drawer-with-adjacent-fullscreen)). The drawer
overlays the full mobile canvas without reserving space or shifting the working product when collapsed
([QUNO-039](../shared/decisions.md#quno-039--overlay-the-full-mobile-canvas-with-the-explainer-drawer)).
Mobile chevron disclosure and header swipes preserve the current playback state
([QUNO-040](../shared/decisions.md#quno-040---keep-mobile-drawer-disclosure-independent-of-playback)).

The Datepicker has seven ordered chapters: Paint a range, Adjust the end, Move the range, Guess the intent,
Access months, Switch to start/end and Single day. Intent cycles an expansion, the other endpoint, then one day.
The introduction and chapter copy explain the author’s reasoning in the same first-person style as Calendar.
Access months scrolls from October 2026 back to July 1980 over 8840 ms and selects the 22nd in single-day mode. Paint alternates two ranges, Adjust restores
its endpoint, and Move returns after a pause; each repeats without clearing or remounting. Intent hovers to reveal
the next selection before a second or third click. Endpoint shortcuts
retain the existing range. The demo shows only the picker; scene JSON chooses
selection mode, with no extra mode switch, hint or result below it. See QDP-131–133 and
[concept notes](../../demo/concept/README.md).

Shared time choices preserve visible option positions during selection and reveal external offscreen choices only
as needed; opening still reveals the selected hour. See shared QUNO-036.

The concept canvas follows the computer's light/dark setting while this product and the explainer retain their
existing light presentation on bright panels; see [QUNO-037](../shared/decisions.md#quno-037---follow-system-appearance-around-light-demo-panels).

The main concept homepage uses shareable product/demo links. The current field guide connects those chapters to
its integration examples and recipes; the previous guide is preserved under `/docs/archive/datepicker`.
See [QUNO-041](../shared/decisions.md#quno-041---promote-the-concept-homepage-and-preserve-field-guides).

Concept chapters now use `/datepicker/{chapter}` directory paths; current navigation omits archive links.
See [QUNO-042](../shared/decisions.md#quno-042---use-directory-routes-and-quiet-documentation-loading).
