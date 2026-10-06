# Quno/Date Parser

Quno/Date Parser owns dependency-free recognition and tokenization of timezone-free dates and inclusive ranges.

- Public entry point: `@quno/calendar/date-parser`
- Live field guide: `/guide/date-parser`
- Focused demo: `/demo/date-parser`
- [Decisions](./decisions.md)
- [Shared usage recipes](../shared/usage.md)
- [Date Input](../date-input/README.md)

The parser supports explicit formats, preferred numeric order, bounded relative phrases, configurable week starts,
ranges, expected-period ranking, English and German vocabularies, lexicon extensions, and tokenization without a UI or
framework dependency. Lexicon extensions add aliases within that bounded grammar; they do not provide general locale
or natural-language parsing.

The field guide's production chapter presents the headless entry point, measured artifact, and runtime contract
directly without repeating them in a separate import implementation accordion.

## Bundle budget

The headless JavaScript entry point has a 7 KiB gzip ceiling, leaving room above the current 6.00 KiB artifact.
See [QDPR-006](./decisions.md#qdpr-006---leave-headroom-in-the-parser-bundle-budget).

## Named contracts

The parser owns its implementation and headless types. Call `parseDateInput({ text, ...options })` and
`tokenizeDateInput({ text })`. `parserLanguages` is the single language setting; resolution internals are private.

See the [breaking migration](../shared/migration.md#unreleased-named-contracts-and-product-ownership).

## Optional clock recognition

Set `recognizeTime: true` on `parseDateInput` to recognize `10:00`, `10AM`, `10:30PM`, `13`, `23`, and `12:59`.
The default remains date-only. `value` still contains timezone-free `IsoDate` endpoints; optional `times` contains
normalized `HH:mm` clocks with `null` for an endpoint whose time was not supplied. A single date/time duplicates both
endpoints; date-only results omit `times`.

```ts
import { parseDateInput, tokenizeDateInput } from "@quno/calendar/date-parser";

const result = parseDateInput({
  text: "tomorrow 23:00–01:00",
  recognizeTime: true,
  referenceDate: "2026-10-05",
  expectedRange: { start: "2026-01-01", end: "2027-12-31" }
});
// value: { start: "2026-10-06", end: "2026-10-07" }
// times: { start: "23:00", end: "01:00" }

const tokens = tokenizeDateInput({ text: "10:30PM", recognizeTime: true });
// { type: "time", value: "22:30", raw: "10:30PM", start: 0, end: 7 }
```

Hours use one or two digits: `0–23` for 24-hour clocks, `1–12` with case-insensitive AM/PM. Minutes require two digits
in `00–59`; spaces before AM/PM are optional. `12AM` is midnight and `12PM` is noon. Time-only input uses
`referenceDate`, defaulting to today. Time may precede or follow one date, using whitespace or `at`/`um` connectors.
Bare numeric tokens keep valid date readings: `12 June 13` remains a date, while `12 June at 13` supplies a clock.
Omitted years use the same ranking as date-only input: with reference date `2026-10-06`, `6 oct 2pm` resolves to
one day, `2026-10-06`, at `14:00`, even when the expected range spans several years.
Existing duration phrases keep their meaning.

Ranges accept existing delimiters, plus compact dashes between explicit clocks (`10:00–11:00`). Bare-hour ranges
need an explicit delimiter (`13 - 23`); `10-11` retains its date reading. A missing date inherits the other endpoint's
date, or uses the reference date if both are omitted. An earlier time on an undated end advances it one calendar day;
equal times stay on the same day. Explicit dates remain authoritative and reversed endpoints normalize with their
own clocks. Missing times and meridiem suffixes are never inherited.

A trailing range delimiter returns `partial-range`, duplicates the recognized start date, and leaves the end time
`null`. Malformed clocks are `invalid`. Single selection allows intraday intervals and rejects overnight ranges.
Times on whole multi-day calendar phrases, seconds, timezones, offsets, dotted meridiem, and natural clock phrases
are unsupported. Date Input and Datepicker can compose one date and one clock with `timeMode` in single-day mode;
see the [date-time recipe](../shared/usage.md#single-day-date-and-time). The headless parser continues to support
intraday and overnight ranges independently of the single-clock UI.
